#!/usr/bin/env python3
"""Capture deterministic GIFs from the repository's real, library-backed preview demos."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
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
        elif demo["id"] == "interaction-history-hiring-badge":
            if index == 3:
                page.locator('[data-role-id="product"]').click()
            elif index == 10:
                page.locator('[data-role-id="creative"]').click()
            elif index == 17:
                page.locator('[data-role-id="motion"]').click()
            elif index == 26:
                page.wait_for_function(
                    "window.__PREVIEW_INTERACTION_STATE__.historyLength === 3 "
                    "&& window.__PREVIEW_INTERACTION_STATE__.badgePhase === 'match-ready' "
                    "&& !window.__PREVIEW_INTERACTION_STATE__.transitionActive",
                    timeout=2_000,
                )
            elif index == 27:
                page.locator('#undo-last').click()
        elif demo["id"] == "opposed-diagonal-offset-cta":
            if index == 4:
                page.locator('#offset-button').hover()
            elif index == 7:
                page.locator('#offset-button').click()
            elif index == 22:
                page.locator('#offset-button').click()
            elif index == 33:
                page.mouse.move(2, 2)
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
        elif demo["id"] == "scrubbed-word-blur-rotate-reveal":
            if index == 1:
                page.mouse.move(160, 110)
            elif index in {3, 5, 7, 9, 11, 13, 15, 17}:
                page.mouse.wheel(0, 70)
        elif demo["id"] == "bubble-to-navigation-morph":
            if index == 3:
                page.locator('#nav-toggle').click()
            elif 4 <= index <= 9:
                page.wait_for_timeout(100)
            elif index == 11:
                page.locator('.nav-link').nth(1).click()
            elif index == 16:
                page.locator('#nav-toggle').click()
            elif 17 <= index <= 22:
                page.wait_for_timeout(100)
            elif index == 26:
                page.locator('#nav-toggle').click()
            elif 27 <= index <= 33:
                page.wait_for_timeout(100)
        elif demo["id"] == "drag-thrown-card-stack":
            if index in {3, 18}:
                box = page.locator('.throw-card[data-active="true"]').bounding_box()
                page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
            elif index == 4:
                page.mouse.down()
            elif index == 6:
                box = page.locator('.throw-card[data-active="true"]').bounding_box()
                page.mouse.move(box["x"] + box["width"] / 2 + 10, box["y"] + box["height"] / 2 + 2)
            elif index == 9:
                box = page.locator('#stack-field').bounding_box()
                page.mouse.move(box["x"] + box["width"] / 2 + 24, box["y"] + box["height"] / 2 + 3)
            elif index == 11:
                page.mouse.up()
            elif 12 <= index <= 17:
                page.wait_for_timeout(80)
            elif index == 19:
                page.mouse.down()
            elif index == 20:
                box = page.locator('.throw-card[data-active="true"]').bounding_box()
                center_x = box["x"] + box["width"] / 2
                center_y = box["y"] + box["height"] / 2
                page.mouse.move(center_x + 24, center_y - 2)
                page.mouse.move(center_x + 120, center_y - 8)
                page.mouse.up()
            elif 21 <= index <= 27:
                page.wait_for_timeout(80)
        elif demo["id"] == "layered-staggered-full-screen-menu":
            if index == 3:
                page.locator('#menu-toggle').click()
            elif index == 15:
                page.locator('.menu-link[data-section="field-notes"]').click()
        elif demo["id"] == "snapping-target-reticle-cursor":
            if index == 3:
                page.locator('.defect-target').nth(1).hover()
            elif 4 <= index <= 7:
                page.wait_for_timeout(120)
            elif index == 8:
                page.locator('.defect-target').nth(1).click()
            elif 9 <= index <= 12:
                page.wait_for_timeout(120)
            elif index == 13:
                page.locator('.defect-target').nth(0).hover()
            elif 14 <= index <= 17:
                page.wait_for_timeout(120)
            elif index == 18:
                page.locator('.defect-target').nth(0).click()
            elif 19 <= index <= 22:
                page.wait_for_timeout(120)
            elif index == 23:
                page.locator('#undo-annotation').click()
            elif index == 24:
                page.locator('#inspection-stage').focus()
                page.keyboard.press('End')
            elif 25 <= index <= 29:
                page.wait_for_timeout(120)
            elif index == 30:
                page.keyboard.press('Enter')
            elif 31 <= index <= 35:
                page.wait_for_timeout(120)
        elif demo["id"] == "clip-shape-theme-reveal":
            if index == 4:
                page.locator('#theme-focus').click()
            elif 5 <= index <= 12:
                page.wait_for_timeout(100)
            elif index == 15:
                page.keyboard.press('ArrowDown')
            elif index == 19:
                page.locator('#theme-research').click()
            elif 20 <= index <= 27:
                page.wait_for_timeout(100)
        elif demo["id"] == "animated-dom-node-connection-beam":
            if index == 3:
                page.locator('#layout-toggle').click()
            elif index == 13:
                page.locator('#send-packet').click()
        elif demo["id"] == "sticky-paragraph-ink-reveal":
            if index == 3:
                box = page.locator('#report-scroll').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .55, box["y"] + box["height"] * .72)
                page.mouse.wheel(0, 126)
            elif index == 5:
                page.mouse.wheel(0, 126)
            elif index == 8:
                box = page.locator('#report-scroll').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .55, box["y"] + box["height"] * .72)
                page.mouse.down()
            elif 9 <= index <= 14:
                box = page.locator('#report-scroll').bounding_box()
                progress = (index - 8) / 6
                page.mouse.move(box["x"] + box["width"] * .55, box["y"] + box["height"] * (.72 + (.32 - .72) * progress))
            elif index == 15:
                page.mouse.up()
            elif index == 20:
                page.locator('#report-scroll').focus()
                page.keyboard.press('PageUp')
            elif index == 25:
                page.keyboard.press('End')
        elif demo["id"] == "voronoi-nearest-point-hover-focus":
            if index in {2, 4, 11, 22}:
                station_id = 'CT-05' if index == 2 else 'NW-03' if index in {4, 22} else 'SE-08'
                point = page.evaluate("stationId => window.__PREVIEW_INTERACTION_STATE__.stationScreenPositions.find(item => item.id === stationId)", station_id)
                box = page.locator('#voronoi-host').bounding_box()
                page.mouse.move(box["x"] + point["x"], box["y"] + point["y"])
            elif index in {7, 14}:
                page.mouse.down()
                page.mouse.up()
            elif index == 18:
                page.locator('#undo-decision').click()
        elif demo["id"] == "linked-brush-to-zoom-chart":
            if index == 3:
                geometry = page.evaluate("window.__PREVIEW_INTERACTION_STATE__.brushGeometry")
                page.mouse.move(geometry["rightHandleX"], (geometry["top"] + geometry["bottom"]) / 2)
                page.mouse.down()
            elif 4 <= index <= 10:
                geometry = page.evaluate("window.__PREVIEW_INTERACTION_STATE__.brushGeometry")
                progress = (index - 3) / 7
                x = geometry["left"] + (geometry["right"] - geometry["left"]) * (.36 + (.72 - .36) * progress)
                page.mouse.move(x, (geometry["top"] + geometry["bottom"]) / 2)
            elif index == 11:
                page.mouse.up()
            elif index == 14:
                page.locator('#keep-window').click()
            elif index == 18:
                page.locator('#brush-host').focus()
                page.keyboard.press('Home')
            elif index == 20:
                page.keyboard.press('ArrowRight')
            elif index == 23:
                page.keyboard.press('End')
            elif index == 26:
                page.keyboard.press('Enter')
        elif demo["id"] == "draggable-force-directed-svg-network":
            if index == 2:
                page.mouse.move(179, 97)
                page.mouse.down()
            elif index == 3:
                page.mouse.move(187, 100)
            elif index == 4:
                page.mouse.move(196, 107)
            elif index == 5:
                page.mouse.move(207, 115)
            elif index == 6:
                page.mouse.up()
            elif index == 21:
                page.locator('#confirm-analysis').click()
        elif demo["id"] == "gooey-pixel-cursor-wake":
            if index == 3:
                box = page.locator('#pixel-wake-host').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .30, box["y"] + box["height"] * .578)
                page.mouse.down()
            elif 4 <= index <= 17:
                box = page.locator('#pixel-wake-host').bounding_box()
                progress = (index - 4) / 13
                page.mouse.move(
                    box["x"] + box["width"] * (.30 + .544 * progress),
                    box["y"] + box["height"] * (.578 + .05 * math.sin(progress * math.pi * 2)),
                )
            elif index == 18:
                page.mouse.up()
            elif index == 19:
                page.wait_for_timeout(260)
        elif demo["id"] == "pointer-reactive-cell-grid":
            if index == 2:
                page.mouse.move(137, 70)
            elif index == 5:
                page.mouse.move(226, 100, steps=4)
            elif index == 7:
                page.mouse.click(226, 100)
        elif demo["id"] == "cursor-projected-3d-surface-marker":
            if index in {4, 7, 10, 13, 16}:
                positions = page.evaluate("window.__SURFACE_INSPECTION_STATE__.targetScreenPositions")
                target_a = next(position for position in positions if position["id"] == "A")
                target_b = next(position for position in positions if position["id"] == "B")
                box = page.locator('#surface-host').bounding_box()
                if index == 4:
                    x, y = target_a["x"] - 24, target_a["y"] + 4
                elif index == 7:
                    x, y = target_a["x"], target_a["y"]
                elif index == 10:
                    x, y = (target_a["x"] + target_b["x"]) / 2, (target_a["y"] + target_b["y"]) / 2
                else:
                    x, y = target_b["x"], target_b["y"]
                page.mouse.move(box["x"] + x, box["y"] + y)
                if index == 16:
                    page.mouse.down()
                    page.mouse.up()
        elif demo["id"] == "neighbor-magnifying-navigation-dock":
            tool_index = {3: 0, 7: 1, 11: 2, 15: 3, 22: 4, 26: 2}.get(index)
            if tool_index is not None:
                page.locator('.dock-tool').nth(tool_index).hover()
            elif index == 18:
                page.locator('.dock-tool').nth(3).click()
        elif demo["id"] == "metaball-blob-cursor":
            if index == 3:
                page.locator('#finish-cobalt').hover()
            elif index == 4:
                page.wait_for_timeout(380)
            elif index == 8:
                page.locator('#finish-moss').hover()
            elif index == 9:
                page.wait_for_timeout(380)
            elif index == 13:
                page.locator('#finish-coral').hover()
            elif index == 14:
                page.wait_for_timeout(380)
            elif index == 18:
                page.locator('#finish-coral').click()
            elif 19 <= index <= 24:
                page.wait_for_timeout(115)
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
        elif demo["id"] == "scroll-stitched-isometric-blueprint":
            if index in (1, 3, 5):
                page.mouse.wheel(0, 120)
            elif index == 7:
                page.mouse.move(140, 120)
                page.mouse.down()
            elif index == 8:
                page.mouse.move(140, 80, steps=4)
            elif index == 9:
                page.mouse.up()
            elif index == 12:
                page.locator('.module-button[data-module="base-rail"]').click()
            elif index == 14:
                page.locator('.module-button[data-module="compute-chassis"]').click()
            elif index == 16:
                page.locator('.module-button[data-module="network-switch"]').click()
            elif index == 18:
                page.locator('.module-button[data-module="telemetry-cap"]').click()
            elif index == 21:
                page.locator("#blueprint-stage").focus()
                page.keyboard.press("PageUp")
            elif index == 23:
                page.keyboard.press("ArrowUp")
            elif index == 25:
                page.keyboard.press("Home")
            elif index == 27:
                page.keyboard.press("End")
            elif index == 30:
                page.mouse.wheel(0, -120)
            elif index in (32, 34):
                page.mouse.wheel(0, 120)
        elif demo["id"] == "animated-bezier-route-cartography":
            if index == 2:
                page.mouse.move(50, 110)
            elif index == 3:
                page.mouse.down()
            elif index == 4:
                page.mouse.move(70, 90, steps=3)
            elif index == 5:
                page.mouse.move(100, 118, steps=3)
            elif index == 6:
                page.mouse.move(130, 110, steps=3)
            elif index == 7:
                page.mouse.move(155, 80, steps=3)
            elif index == 8:
                page.mouse.move(180, 60, steps=3)
            elif index == 9:
                page.mouse.move(200, 50, steps=3)
            elif index == 10:
                page.mouse.up()
            elif index == 12:
                page.locator('.stop-control[data-stop-index="1"]').click()
            elif index == 14:
                page.locator("#route-range").click(position={"x": 24, "y": 5})
            elif index == 16:
                page.locator("#route-range").click(position={"x": 82, "y": 5})
            elif index == 18:
                page.locator('.stop-control[data-stop-index="2"]').click()
            elif index == 20:
                page.locator("#route-map").focus()
                page.keyboard.press("Home")
            elif index == 22:
                page.keyboard.press("End")
            elif index == 24:
                page.keyboard.press("ArrowLeft")
            elif index == 26:
                page.keyboard.press("PageDown")
            elif index == 28:
                page.keyboard.press("PageUp")
            elif index == 30:
                page.locator('.stop-control[data-stop-index="0"]').click()
            elif index == 32:
                page.locator('.stop-control[data-stop-index="2"]').click()
        elif demo["id"] == "radial-calendar-time-zoom":
            if index == 2:
                page.mouse.move(310, 90)
            elif index == 3:
                page.mouse.move(312, 92, steps=2)
            elif index == 5:
                page.mouse.down()
            elif index == 6:
                page.mouse.move(270, 155, steps=3)
            elif index == 7:
                page.mouse.move(236, 172, steps=3)
            elif index == 8:
                page.mouse.move(175, 135, steps=3)
            elif index == 9:
                page.mouse.move(158, 90, steps=3)
            elif index == 10:
                page.mouse.move(190, 25, steps=3)
            elif index == 11:
                page.mouse.move(236, 15, steps=3)
            elif index == 12:
                page.mouse.up()
            elif index in (15, 16, 17):
                page.locator('[data-calendar-action="next"]').click()
            elif index == 19:
                page.locator('[data-calendar-action="confirm"]').click()
            elif index == 21:
                page.locator("#schedule-stage").focus()
                page.keyboard.press("Escape")
            elif index == 23:
                page.locator('[data-calendar-action="confirm"]').click()
            elif index == 25:
                page.locator("#schedule-stage").focus()
                page.keyboard.press("ArrowRight")
            elif index == 27:
                page.keyboard.press("ArrowLeft")
            elif index == 29:
                page.keyboard.press("Enter")
        elif demo["id"] == "radar-sweep-annotation-reveal":
            if index == 2:
                page.mouse.move(92, 29)
            elif index == 5:
                page.mouse.move(130, 103)
            elif index == 7:
                page.mouse.down()
            elif index == 8:
                page.mouse.move(249, 137, steps=4)
            elif index == 9:
                page.mouse.move(244, 45, steps=4)
            elif index == 10:
                page.mouse.up()
            elif index in (13, 15, 17, 19):
                page.locator('[data-radar-action="next"]').click()
            elif index == 21:
                page.locator("#survey-surface").focus()
                page.keyboard.press("[")
            elif index == 23:
                page.keyboard.press("]")
            elif index == 25:
                page.keyboard.press("ArrowRight")
            elif index == 27:
                page.keyboard.press("ArrowLeft")
            elif index == 30:
                page.locator('[data-radar-action="reset"]').click()
            elif index == 32:
                page.locator('[data-radar-action="next"]').click()
        elif demo["id"] == "spring-loaded-split-flap-counter":
            if index == 3:
                proof_bounds = page.locator("#proof-card").bounding_box()
                if not proof_bounds:
                    raise RuntimeError("spring-loaded-split-flap-counter proofboard has no bounds")
                page.mouse.move(
                    proof_bounds["x"] + proof_bounds["width"] * .5,
                    proof_bounds["y"] + proof_bounds["height"] * .8,
                )
            elif index == 5:
                range_bounds = page.locator("#release-range").bounding_box()
                if not range_bounds:
                    raise RuntimeError("spring-loaded-split-flap-counter range has no bounds")
                page.mouse.move(
                    range_bounds["x"] + range_bounds["width"] * .92,
                    range_bounds["y"] + range_bounds["height"] * .5,
                )
                page.mouse.down()
            elif index in (6, 7, 8, 9):
                ratios = {6: .8, 7: .65, 8: .5, 9: .35}
                range_bounds = page.locator("#release-range").bounding_box()
                if not range_bounds:
                    raise RuntimeError("spring-loaded-split-flap-counter range has no bounds")
                page.mouse.move(
                    range_bounds["x"] + range_bounds["width"] * ratios[index],
                    range_bounds["y"] + range_bounds["height"] * .5,
                    steps=2,
                )
            elif index == 10:
                page.mouse.up()
            elif index == 13:
                page.locator("#plus-button").click()
            elif index == 15:
                page.locator("#sync-button").click()
            elif index == 18:
                page.locator("#inventory-stage").focus()
                page.keyboard.press("Home")
            elif index == 20:
                page.keyboard.press("End")
            elif index == 22:
                page.keyboard.press("ArrowLeft")
            elif index == 24:
                page.locator("#reset-button").click()
            elif index == 27:
                proof_bounds = page.locator("#proof-card").bounding_box()
                if not proof_bounds:
                    raise RuntimeError("spring-loaded-split-flap-counter proofboard has no bounds")
                page.mouse.move(
                    proof_bounds["x"] + proof_bounds["width"] * .5,
                    proof_bounds["y"] + proof_bounds["height"] * .45,
                )
            elif index == 29:
                page.mouse.move(300, 20)
        elif demo["id"] == "caustic-light-card-surface":
            if index == 3:
                page.mouse.move(248, 54)
            elif index == 5:
                page.mouse.move(72, 58)
                page.mouse.down()
            elif index == 6:
                page.mouse.move(128, 42, steps=3)
            elif index == 7:
                page.mouse.move(226, 54, steps=3)
            elif index == 8:
                page.mouse.move(266, 122, steps=3)
            elif index == 9:
                page.mouse.move(154, 126, steps=3)
            elif index == 10:
                page.mouse.up()
            elif index == 13:
                page.locator('[data-light-action="shallower"]').click()
            elif index == 15:
                page.locator('[data-light-action="deeper"]').click()
            elif index == 17:
                range_bounds = page.locator("#depth-range").bounding_box()
                if not range_bounds:
                    raise RuntimeError("caustic-light-card-surface depth range has no bounds")
                page.mouse.move(
                    range_bounds["x"] + range_bounds["width"] * .88,
                    range_bounds["y"] + range_bounds["height"] * .5,
                )
                page.mouse.down()
            elif index == 18:
                range_bounds = page.locator("#depth-range").bounding_box()
                if not range_bounds:
                    raise RuntimeError("caustic-light-card-surface depth range has no bounds")
                page.mouse.move(
                    range_bounds["x"] + range_bounds["width"] * .02,
                    range_bounds["y"] + range_bounds["height"] * .5,
                    steps=4,
                )
            elif index == 19:
                page.mouse.up()
            elif index == 20:
                page.locator("#caustic-stage").focus()
                page.keyboard.press("ArrowLeft")
            elif index == 21:
                page.keyboard.press("ArrowUp")
            elif index == 22:
                page.keyboard.press("]")
            elif index == 23:
                page.keyboard.press("Enter")
            elif index == 25:
                page.locator('[data-light-action="reset"]').click()
            elif index == 28:
                page.mouse.move(244, 55)
        elif demo["id"] == "cursor-drawn-constellation-thread":
            if index == 3:
                route = page.evaluate("window.__PREVIEW_INTERACTION_STATE__.routeEvidence")
                page.mouse.move(route[0]["u"] * 320, route[0]["v"] * 180)
            elif index == 5:
                route = page.evaluate("window.__PREVIEW_INTERACTION_STATE__.routeEvidence")
                page.mouse.move(route[0]["u"] * 320, route[0]["v"] * 180)
                page.mouse.down()
            elif index in (6, 7, 8, 9, 10):
                route = page.evaluate("window.__PREVIEW_INTERACTION_STATE__.routeEvidence")
                target = route[index - 5]
                page.mouse.move(target["u"] * 320, target["v"] * 180, steps=3)
            elif index == 11:
                page.mouse.up()
            elif index == 13:
                page.locator('[data-constellation-action="confirm"]').click()
            elif index == 15:
                page.locator('[data-constellation-action="undo"]').click()
            elif index == 17:
                page.locator("#constellation-stage").focus()
                page.keyboard.press("Enter")
            elif index == 19:
                page.locator('[data-constellation-action="confirm"]').click()
            elif index == 25:
                route = page.evaluate("window.__PREVIEW_INTERACTION_STATE__.routeEvidence")
                page.mouse.move(route[5]["u"] * 320, route[5]["v"] * 180)
        elif demo["id"] == "accordion-depth-tunnel-navigation":
            if index == 2:
                page.mouse.move(135, 80)
            elif index == 4:
                page.mouse.move(250, 80)
            elif index == 6:
                page.mouse.move(150, 80)
                page.mouse.down()
            elif index == 7:
                page.mouse.move(185, 80, steps=2)
            elif index == 8:
                page.mouse.move(220, 80, steps=2)
            elif index == 9:
                page.mouse.move(270, 80, steps=3)
            elif index == 10:
                page.mouse.up()
            elif index == 12:
                page.locator('[data-action="previous"]').click()
            elif index == 14:
                page.locator('[data-action="target"]').click()
            elif index == 16:
                page.locator("#depth-range").focus()
                page.keyboard.press("ArrowLeft")
            elif index == 18:
                page.locator("#depth-stage").focus()
                page.keyboard.press("Home")
            elif index == 20:
                page.keyboard.press("ArrowRight")
            elif index == 22:
                page.keyboard.press("t")
            elif index == 24:
                page.keyboard.press("Escape")
            elif index == 26:
                page.locator('[data-action="target"]').click()
        elif demo["id"] == "kinetic-rain-letterpress":
            if index == 2:
                page.mouse.move(177, 76)
            elif index == 4:
                page.mouse.move(177, 82)
                page.mouse.down()
            elif index == 5:
                page.mouse.move(177, 106, steps=2)
            elif index == 6:
                page.mouse.move(177, 133, steps=2)
            elif index == 7:
                page.mouse.up()
            elif index == 9:
                page.locator('[data-ink="rust"]').click()
            elif index == 11:
                page.locator("#press-pressure").focus()
                page.keyboard.press("ArrowLeft")
                page.keyboard.press("ArrowLeft")
                page.keyboard.press("ArrowLeft")
            elif index in (14, 17, 20, 23):
                page.locator('[data-action="step"]').click()
            elif index == 26:
                page.locator('[data-action="undo"]').click()
            elif index == 29:
                page.locator('[data-action="step"]').click()
            elif index == 32:
                page.locator("#press-stage").focus()
                page.keyboard.press("ArrowRight")
        elif demo["id"] == "polar-waveform-sundial":
            if index == 2:
                page.mouse.move(255, 63)
            elif index == 4:
                page.mouse.move(232, 137)
                page.mouse.down()
            elif index == 5:
                page.mouse.move(245, 126, steps=2)
            elif index == 6:
                page.mouse.move(262, 107, steps=2)
            elif index == 7:
                page.mouse.move(271, 90, steps=2)
            elif index == 8:
                page.mouse.move(260, 67, steps=2)
            elif index == 9:
                page.mouse.move(238, 48, steps=2)
            elif index == 10:
                page.mouse.up()
            elif index == 13:
                page.locator('[data-sundial-action="quietest"]').click()
            elif index == 15:
                page.locator("#sundial-stage").focus()
                page.keyboard.press("ArrowRight")
            elif index == 18:
                page.locator("#frequency-band").focus()
                page.keyboard.press("ArrowRight")
                page.keyboard.press("ArrowRight")
            elif index == 21:
                page.locator('[data-sundial-action="mark"]').click()
            elif index == 24:
                page.locator('[data-sundial-action="reset"]').click()
            elif index == 27:
                page.locator('[data-sundial-action="quietest"]').click()
            elif index == 30:
                page.locator("#sundial-stage").focus()
                page.keyboard.press("m")
        elif demo["id"] == "seeded-sandpile-avalanche":
            if index == 2:
                page.mouse.move(225, 70)
            elif index == 4:
                page.locator("#load-size").focus()
                page.keyboard.press("ArrowRight")
            elif index == 6:
                page.mouse.move(150, 65)
                page.mouse.down()
            elif index == 7:
                page.mouse.move(180, 75, steps=2)
            elif index == 8:
                page.mouse.move(210, 90, steps=2)
            elif index == 9:
                page.mouse.move(240, 105, steps=2)
            elif index == 10:
                page.mouse.move(270, 120, steps=2)
            elif index == 11:
                page.mouse.up()
            elif index == 13:
                page.locator('[data-sand-action="step"]').click()
            elif index == 15:
                page.locator('[data-sand-action="undo"]').click()
            elif index == 17:
                page.locator('[data-sand-action="reset"]').click()
            elif index == 19:
                page.locator('[data-sand-action="deposit"]').click()
            elif index == 21:
                page.locator("#sandpile-stage").focus()
                page.keyboard.press("Space")
            elif index == 23:
                page.keyboard.press("z")
            elif index == 25:
                page.keyboard.press("Enter")
        elif demo["id"] == "signed-distance-neon-metropolis":
            if index == 2:
                page.mouse.move(250, 116)
            elif index == 5:
                page.mouse.down()
            elif index == 6:
                page.mouse.move(220, 105, steps=2)
            elif index == 7:
                page.mouse.move(190, 90, steps=2)
            elif index == 8:
                page.mouse.move(165, 76, steps=3)
            elif index == 9:
                page.mouse.up()
            elif index == 12:
                page.locator("#clearance-buffer").focus()
                page.keyboard.press("ArrowRight")
                page.keyboard.press("ArrowRight")
            elif index == 16:
                page.locator("#clearance-canvas-host").focus()
                page.keyboard.press("ArrowLeft")
            elif index == 20:
                page.locator('[data-action="pin"]').click()
        elif demo["id"] == "flowfield-paper-marbling":
            if index == 2:
                page.mouse.move(180, 80)
            elif index == 4:
                page.mouse.move(140, 62)
                page.mouse.down()
            elif index == 5:
                page.mouse.move(180, 80, steps=2)
            elif index == 6:
                page.mouse.move(220, 95, steps=2)
            elif index == 7:
                page.mouse.move(260, 110, steps=2)
            elif index == 8:
                page.mouse.up()
            elif index == 10:
                page.locator("#comb-tines").focus()
                page.keyboard.press("ArrowRight")
            elif index == 12:
                page.locator('[data-action="approve"]').click()
            elif index == 15:
                page.locator('[data-action="undo"]').click()
            elif index == 17:
                page.locator('[data-action="reset"]').click()
            elif index == 19:
                page.mouse.move(250, 55)
                page.mouse.down()
            elif index == 20:
                page.mouse.move(220, 73, steps=2)
            elif index == 21:
                page.mouse.move(185, 94, steps=2)
            elif index == 22:
                page.mouse.move(150, 118, steps=2)
            elif index == 23:
                page.mouse.up()
            elif index == 25:
                page.locator("#marbling-stage").focus()
                page.keyboard.press("ArrowRight")
            elif index == 27:
                page.keyboard.press("Enter")
        elif demo["id"] == "kinetic-variable-font-axis":
            if index == 2:
                page.mouse.move(165, 95)
            elif index == 4:
                page.mouse.move(160, 105)
                page.mouse.down()
            elif index == 5:
                page.mouse.move(190, 88, steps=2)
            elif index == 6:
                page.mouse.move(220, 66, steps=2)
            elif index == 7:
                page.mouse.move(248, 43, steps=2)
            elif index == 8:
                page.mouse.up()
            elif index == 10:
                page.locator("#match-button").click()
            elif index == 13:
                page.locator("#reset-button").click()
            elif index == 16:
                page.locator("#width-range").focus()
                page.keyboard.press("ArrowRight")
            elif index == 18:
                page.locator("#weight-range").focus()
                page.keyboard.press("ArrowUp")
            elif index == 20:
                page.locator("#specimen-surface").focus()
                page.keyboard.press("Enter")
        elif demo["id"] == "gravity-well-icon-field":
            if index == 2:
                page.mouse.move(58, 54)
            elif index == 4:
                page.mouse.move(58, 54)
                page.mouse.down()
            elif index == 5:
                page.mouse.move(112, 105, steps=2)
            elif index == 6:
                page.mouse.move(205, 83, steps=3)
            elif index == 7:
                page.mouse.up()
            elif index in (9, 11):
                page.locator('[data-lens-action="stronger"]').click()
            elif index == 13:
                page.locator("#lens-surface").focus()
                page.keyboard.press("ArrowLeft")
            elif index == 15:
                page.keyboard.press("ArrowUp")
            elif index == 17:
                page.keyboard.press("Enter")
            elif index == 19:
                page.locator('[data-lens-action="weaker"]').click()
            elif index == 21:
                page.locator('[data-lens-action="reset"]').click()
            elif index == 23:
                page.locator('[data-lens-action="lock"]').click()
        elif demo["id"] == "magnetic-orbit-command-dock":
            if index == 2:
                page.mouse.move(95, 92)
            elif index == 5:
                page.mouse.move(242, 24)
            elif index == 8:
                page.mouse.move(222, 80)
                page.mouse.down()
            elif index == 9:
                page.mouse.move(246, 95, steps=2)
            elif index == 10:
                page.mouse.move(278, 115, steps=2)
            elif index == 11:
                page.mouse.up()
            elif index == 14:
                page.locator("#command-stage").focus()
                page.keyboard.press("ArrowLeft")
            elif index == 16:
                page.keyboard.press("ArrowUp")
            elif index == 18:
                page.keyboard.press("Enter")
            elif index == 21:
                page.locator("#pull-strength").focus()
                page.keyboard.press("ArrowRight")
                page.keyboard.press("ArrowRight")
            elif index == 24:
                page.locator('[data-command="trace"]').click()
            elif index == 27:
                page.locator('[data-action="reset"]').click()
            elif index == 29:
                page.mouse.move(200, 70)
            elif index == 31:
                page.locator("#command-stage").focus()
                page.keyboard.press("ArrowRight")
            elif index == 33:
                page.keyboard.press("Enter")
        elif demo["id"] == "stencil-text-scanline-window":
            if index == 2:
                page.mouse.move(286, 80)
            elif index == 4:
                page.mouse.move(285, 65)
                page.mouse.down()
            elif index == 5:
                page.mouse.move(250, 115, steps=2)
            elif index == 6:
                page.mouse.move(210, 110, steps=2)
            elif index == 7:
                page.mouse.move(170, 95, steps=2)
            elif index == 8:
                page.mouse.move(130, 75, steps=2)
            elif index == 9:
                page.mouse.move(90, 55, steps=2)
            elif index == 10:
                page.mouse.move(45, 40, steps=2)
            elif index == 11:
                page.mouse.move(300, 90, steps=6)
            elif index == 12:
                page.mouse.up()
            elif index == 14:
                page.locator('[data-action="evaluate"]').click()
            elif index == 16:
                page.locator("#registration-stage").focus()
                page.keyboard.press("r")
            elif index == 18:
                page.locator("#scan-range").focus()
                page.keyboard.press("End")
            elif index == 20:
                page.locator("#registration-stage").focus()
                page.keyboard.press("Home")
            elif index == 21:
                page.keyboard.press("ArrowRight")
            elif index == 22:
                page.keyboard.press("End")
            elif index == 24:
                page.locator('[data-action="evaluate"]').click()
            elif index == 26:
                page.mouse.move(300, 90)
                page.mouse.down()
            elif index == 27:
                page.mouse.move(250, 80, steps=2)
            elif index == 28:
                page.mouse.move(200, 100, steps=2)
            elif index == 29:
                page.mouse.move(150, 70, steps=2)
            elif index == 30:
                page.mouse.move(100, 105, steps=2)
            elif index == 31:
                page.mouse.move(50, 90, steps=2)
            elif index == 32:
                page.mouse.up()
            elif index == 34:
                page.locator('[data-action="evaluate"]').click()
        elif demo["id"] == "cellular-automata-hover-bloom":
            if index == 3:
                page.mouse.move(122, 93)
            elif index == 5:
                page.mouse.move(122, 93)
                page.mouse.down()
            elif index == 6:
                page.mouse.move(132, 88, steps=3)
            elif index == 7:
                page.mouse.move(142, 82, steps=3)
            elif index == 8:
                page.mouse.move(152, 76, steps=3)
            elif index == 9:
                page.mouse.move(162, 72, steps=3)
            elif index == 10:
                page.mouse.up()
            elif index in (12, 14):
                page.locator('[data-bloom-action="step"]').click()
            elif index == 16:
                page.locator("#tolerance").focus()
                page.keyboard.press("ArrowLeft")
            elif index == 17:
                page.keyboard.press("ArrowLeft")
            elif index == 19:
                page.locator("#bloom-stage").focus()
                page.keyboard.press("ArrowRight")
            elif index == 20:
                page.keyboard.press("Space")
            elif index == 22:
                page.keyboard.press("Enter")
            elif index == 24:
                page.locator('[data-bloom-action="undo"]').click()
            elif index == 26:
                page.locator('[data-bloom-action="reset"]').click()
            elif index == 28:
                page.mouse.move(130, 104)
            elif index == 29:
                page.mouse.down()
            elif index == 30:
                page.mouse.move(145, 98, steps=3)
            elif index == 31:
                page.mouse.move(160, 91, steps=3)
            elif index == 32:
                page.mouse.up()
            elif index == 34:
                page.locator('[data-bloom-action="step"]').click()
        elif demo["id"] == "elastic-voronoi-focus-mosaic":
            if index == 3:
                page.mouse.move(294, 41)
            elif index == 5:
                page.mouse.move(294, 41)
                page.mouse.down()
            elif index == 6:
                page.mouse.move(256, 85, steps=3)
            elif index == 7:
                page.mouse.move(185, 137, steps=3)
            elif index == 8:
                page.mouse.move(269, 137, steps=3)
            elif index == 9:
                page.mouse.up()
            elif index == 12:
                page.locator('[data-focus-action="previous"]').click()
            elif index == 14:
                page.locator('[data-focus-action="lock"]').click()
            elif index in (16, 18):
                page.locator('[data-focus-action="next"]').click()
            elif index == 20:
                page.locator("#mosaic-surface").focus()
                page.keyboard.press("ArrowRight")
            elif index == 22:
                page.keyboard.press("Enter")
            elif index == 24:
                page.locator('[data-focus-action="reset"]').click()
            elif index == 27:
                page.locator('[data-focus-action="next"]').click()
            elif index == 30:
                page.locator('[data-focus-action="lock"]').click()
        elif demo["id"] == "magnetic-pixel-sort-field":
            if index == 2:
                page.mouse.move(90, 66)
            elif index == 4:
                page.mouse.move(98, 68)
                page.mouse.down()
            elif index == 5:
                page.mouse.move(120, 73, steps=2)
            elif index == 6:
                page.mouse.move(145, 79, steps=2)
            elif index == 7:
                page.mouse.move(170, 71, steps=2)
            elif index == 8:
                page.mouse.move(198, 62, steps=2)
            elif index == 9:
                page.mouse.up()
            elif index == 12:
                page.locator("#field-strength").focus()
                page.keyboard.press("ArrowRight")
            elif index == 14:
                page.locator('[data-sort-action="commit"]').click()
            elif index == 16:
                page.locator('[data-sort-action="undo"]').click()
            elif index == 18:
                page.locator('[data-sort-action="restore"]').click()
            elif index == 20:
                page.mouse.move(200, 100)
            elif index == 21:
                page.mouse.down()
            elif index == 22:
                page.mouse.move(170, 120, steps=2)
            elif index == 23:
                page.mouse.move(145, 112, steps=2)
            elif index == 24:
                page.mouse.move(120, 100, steps=2)
            elif index == 25:
                page.mouse.up()
            elif index == 27:
                page.locator("#sort-surface").focus()
                page.keyboard.press("ArrowRight")
            elif index == 28:
                page.keyboard.press("ArrowDown")
            elif index == 30:
                page.keyboard.press("Enter")
            elif index == 32:
                page.locator("#field-strength").focus()
                page.keyboard.press("ArrowLeft")
            elif index == 34:
                page.locator('[data-sort-action="commit"]').click()
        elif demo["id"] == "reaction-diffusion-growth-field":
            if index == 2:
                page.mouse.move(230, 90)
            elif index == 4:
                page.mouse.down()
            elif index == 5:
                page.mouse.move(210, 80, steps=2)
            elif index == 6:
                page.mouse.move(190, 70, steps=2)
            elif index == 7:
                page.mouse.move(170, 90, steps=2)
            elif index == 8:
                page.mouse.move(190, 110, steps=2)
            elif index == 9:
                page.mouse.move(220, 120, steps=2)
            elif index == 10:
                page.mouse.up()
            elif index == 12:
                page.locator("#nutrient-bias").focus()
                page.keyboard.press("ArrowRight")
                page.keyboard.press("ArrowRight")
            elif index == 15:
                page.locator('[data-culture-action="step"]').click()
            elif index == 18:
                page.locator("#culture-stage").focus()
                page.keyboard.press("ArrowRight")
            elif index == 20:
                page.keyboard.press("Enter")
            elif index == 22:
                page.keyboard.press("Space")
            elif index == 25:
                page.locator('[data-culture-action="step"]').click()
            elif index == 31:
                page.locator('[data-culture-action="step"]').click()
        elif demo["id"] == "kinetic-typography-letter-springs":
            if index == 2:
                page.mouse.move(41, 100)
            elif index == 4:
                page.mouse.down()
            elif index == 5:
                page.mouse.move(58, 91, steps=2)
            elif index == 6:
                page.mouse.move(77, 105, steps=2)
            elif index == 7:
                page.mouse.move(100, 87, steps=2)
            elif index == 8:
                page.mouse.move(124, 99, steps=2)
            elif index == 9:
                page.mouse.move(150, 92, steps=2)
            elif index == 10:
                page.mouse.up()
            elif index == 12:
                page.locator("#pull-range").focus()
                page.keyboard.press("ArrowRight")
                page.keyboard.press("ArrowRight")
            elif index == 14:
                page.locator('[data-action="hold"]').click()
            elif index == 20:
                page.locator('[data-action="release"]').click()
            elif index == 24:
                page.locator("#type-canvas-host").focus()
                page.keyboard.press("ArrowRight")
            elif index == 25:
                page.keyboard.press("ArrowUp")
            elif index == 27:
                page.locator('[data-action="hold"]').click()
        elif demo["id"] == "typography-particle-disassembly-field":
            if index == 3:
                page.mouse.move(240, 75)
            elif index == 5:
                page.mouse.move(64, 104)
                page.mouse.down()
            elif index == 6:
                page.mouse.move(96, 104, steps=2)
            elif index == 7:
                page.mouse.move(128, 104, steps=2)
            elif index == 8:
                page.mouse.move(160, 104, steps=2)
            elif index == 9:
                page.mouse.move(192, 104, steps=2)
            elif index == 10:
                page.mouse.move(220, 104, steps=2)
            elif index == 11:
                page.mouse.up()
            elif index == 15:
                page.locator('[data-release-action="balance"]').click()
            elif index == 21:
                page.locator('[data-release-action="approve"]').click()
        elif demo["id"] == "flow-field-ribbon-advection":
            if index == 2:
                page.mouse.move(218, 76)
            elif index == 4:
                page.mouse.move(252, 98)
            elif index == 6:
                page.mouse.move(170, 115)
                page.mouse.down()
            elif index == 7:
                page.mouse.move(180, 106, steps=2)
            elif index == 8:
                page.mouse.move(190, 98, steps=2)
            elif index == 9:
                page.mouse.move(199, 90, steps=2)
            elif index == 10:
                page.mouse.move(207, 84, steps=2)
            elif index == 11:
                page.mouse.up()
            elif index == 14:
                page.locator("#vessel-draft").focus()
                page.keyboard.press("ArrowRight")
                page.keyboard.press("ArrowRight")
            elif index == 18:
                page.locator('[data-route-action="safe"]').click()
            elif index == 22:
                page.locator('[data-route-action="lock"]').click()
        elif demo["id"] == "signed-distance-neon-metaballs":
            if index == 4:
                page.mouse.move(75, 100)
            elif index == 5:
                page.mouse.down()
            elif index == 6:
                page.mouse.move(84, 100)
            elif index == 7:
                page.mouse.move(94, 100)
            elif index == 8:
                page.mouse.move(104, 100)
            elif index == 9:
                page.mouse.move(112, 100)
            elif index == 10:
                page.mouse.move(120, 100)
            elif index == 11:
                page.mouse.up()
            elif index == 16:
                page.locator('[data-relay-action="increase"]').click()
            elif index == 18:
                page.locator('[data-relay-action="increase"]').click()
        elif demo["id"] == "elastic-svg-rope-lettering":
            if index == 2:
                page.mouse.move(125, 121)
            elif index == 4:
                page.mouse.move(151, 121)
            elif index == 6:
                page.mouse.down()
            elif index == 7:
                page.mouse.move(154, 112, steps=2)
            elif index == 8:
                page.mouse.move(156, 106, steps=2)
            elif index == 9:
                page.mouse.move(158, 101, steps=2)
            elif index == 10:
                page.mouse.move(160, 98, steps=2)
            elif index == 11:
                page.mouse.up()
            elif index == 14:
                page.locator('[data-material="coral"]').click()
            elif index == 17:
                page.locator("#tension-button").click()
            elif index == 20:
                page.locator("#rope-workbench").focus()
                page.keyboard.press("]")
            elif index == 21:
                page.keyboard.press("ArrowUp")
            elif index == 22:
                page.keyboard.press("ArrowRight")
            elif index == 25:
                page.locator("#lock-button").click()
        elif demo["id"] == "boids-flock-pointer-avoidance":
            if index == 4:
                page.locator("#clearance-radius").focus()
                page.keyboard.press("End")
            elif index == 6:
                page.mouse.move(90, 145)
            elif index == 10:
                page.mouse.down()
            elif index == 11:
                page.mouse.move(120, 135)
            elif index == 12:
                page.mouse.move(150, 125)
            elif index == 13:
                page.mouse.move(180, 115)
            elif index == 14:
                page.mouse.move(210, 105)
            elif index == 15:
                page.mouse.move(240, 95)
            elif index == 16:
                page.mouse.up()
        elif demo["id"] == "recursive-quadtree-pulse-mosaic":
            if index == 3:
                page.mouse.move(226, 68)
            elif index == 6:
                page.mouse.down()
            elif index == 7:
                page.mouse.move(205, 79, steps=2)
            elif index == 8:
                page.mouse.move(180, 91, steps=2)
            elif index == 9:
                page.mouse.move(151, 106, steps=2)
            elif index == 10:
                page.mouse.move(121, 119, steps=2)
            elif index == 11:
                page.mouse.move(91, 108, steps=2)
            elif index == 12:
                page.mouse.up()
            elif index == 16:
                page.locator('[data-lod-action="more"]').click()
            elif index == 20:
                page.locator("#survey-stage").focus()
                page.keyboard.press("ArrowRight")
            elif index == 21:
                page.keyboard.press("ArrowUp")
            elif index == 24:
                page.keyboard.press("-")
            elif index == 27:
                page.keyboard.press("Home")
            elif index == 31:
                page.mouse.move(167, 73)
        elif demo["id"] == "delaunay-triangulated-light-sweep":
            if index == 2:
                page.mouse.move(240, 68)
            elif index == 4:
                page.mouse.move(160, 82)
            elif index == 5:
                page.mouse.down()
            elif index == 6:
                page.mouse.move(175, 75, steps=2)
            elif index == 7:
                page.mouse.move(195, 64, steps=2)
            elif index == 8:
                page.mouse.move(214, 56, steps=2)
            elif index == 9:
                page.mouse.move(228, 51, steps=2)
            elif index == 10:
                page.mouse.up()
            elif index == 13:
                page.locator('[data-scan-action="seam"]').click()
            elif index == 16:
                page.locator('[data-scan-action="void"]').click()
            elif index == 19:
                page.locator("#radius-control").focus()
                page.keyboard.press("ArrowRight")
                page.keyboard.press("ArrowRight")
            elif index == 22:
                page.locator("#inspection-stage").focus()
                page.keyboard.press("ArrowLeft")
            elif index == 24:
                page.keyboard.press("]")
        elif demo["id"] == "topographic-wave-contour-reveal":
            if index == 4:
                page.mouse.move(110, 65)
            elif index == 5:
                page.mouse.down()
            elif index == 6:
                page.mouse.move(140, 75, steps=2)
            elif index == 7:
                page.mouse.move(170, 90, steps=2)
            elif index == 8:
                page.mouse.move(200, 100, steps=2)
            elif index == 9:
                page.mouse.move(225, 110, steps=2)
            elif index == 10:
                page.mouse.move(250, 120, steps=2)
            elif index == 11:
                page.mouse.up()
            elif index == 16:
                page.locator('[data-terrain-action="raise"]').click()
            elif index == 19:
                page.locator('[data-terrain-action="raise"]').click()
        elif demo["id"] == "typographic-time-slit":
            if index == 3:
                page.mouse.move(154, 42)
            elif index == 6:
                page.mouse.move(154, 76, steps=3)
            elif index == 9:
                page.mouse.down()
            elif index == 10:
                page.mouse.move(154, 106, steps=2)
            elif index == 11:
                page.mouse.move(154, 136, steps=2)
            elif index == 12:
                page.mouse.up()
            elif index == 15:
                page.locator('[data-slit-target="0.14"]').click()
            elif index == 18:
                page.locator('[data-slit-target="0.46"]').click()
            elif index == 21:
                page.locator("#expansion-stage").focus()
                page.keyboard.press("PageDown")
            elif index == 24:
                page.keyboard.press("ArrowUp")
            elif index == 27:
                page.locator('[data-slit-target="0.74"]').click()
            elif index == 30:
                page.locator('[data-slit-target="0.58"]').click()
            elif index == 33:
                page.mouse.move(154, 95)
        elif demo["id"] == "moire-tunnel-zoom":
            if index == 3:
                page.mouse.move(171, 76)
            elif index == 6:
                page.mouse.down()
            elif index == 7:
                page.mouse.move(188, 84, steps=2)
            elif index == 8:
                page.mouse.move(208, 96, steps=2)
            elif index == 9:
                page.mouse.move(232, 108, steps=2)
            elif index == 10:
                page.mouse.up()
            elif index == 13:
                page.locator('[data-channel="1"]').click()
            elif index == 16:
                page.locator("#tunnel-depth").focus()
                page.keyboard.press("ArrowRight")
                page.keyboard.press("ArrowRight")
            elif index == 19:
                page.locator('[data-action="assess"]').click()
            elif index == 22:
                page.locator('[data-action="next"]').click()
            elif index == 24:
                page.locator('[data-action="assess"]').click()
            elif index == 27:
                page.locator('[data-action="undo"]').click()
            elif index == 30:
                page.locator("#tunnel-stage").focus()
                page.keyboard.press("ArrowLeft")
                page.keyboard.press("ArrowUp")
            elif index == 33:
                page.locator('[data-action="reset"]').click()
        elif demo["id"] == "procedural-folding-kaleidoscope":
            if index == 2:
                page.mouse.move(230, 65)
            elif index == 4:
                page.mouse.move(246, 76)
            elif index == 6:
                page.mouse.move(224, 96)
                page.mouse.down()
            elif index == 7:
                page.mouse.move(242, 101)
            elif index == 8:
                page.mouse.move(260, 108)
            elif index == 9:
                page.mouse.move(278, 116)
            elif index == 10:
                page.mouse.up()
            elif index == 14:
                page.locator("#fold-less").click()
            elif index == 17:
                page.locator("#fold-proof-canvas").focus()
                page.keyboard.press("ArrowDown")
            elif index == 20:
                page.keyboard.press("ArrowLeft")
        elif demo["id"] == "elastic-baseline-letter-wave":
            if index == 4:
                page.mouse.move(80, 80)
            elif index == 5:
                page.mouse.down()
            elif index == 6:
                page.mouse.move(110, 65)
            elif index == 7:
                page.mouse.move(140, 50)
            elif index == 8:
                page.mouse.move(170, 65)
            elif index == 9:
                page.mouse.move(200, 85)
            elif index == 10:
                page.mouse.move(230, 60)
            elif index == 11:
                page.mouse.up()
            elif index == 18:
                page.locator('[data-baseline-action="settle"]').click()
        elif demo["id"] == "recursive-arc-forest-growth":
            if index == 2:
                page.mouse.move(235, 66)
            elif index == 4:
                page.mouse.move(178, 104)
                page.mouse.down()
            elif index == 5:
                page.mouse.move(195, 99, steps=2)
            elif index == 6:
                page.mouse.move(210, 94, steps=2)
            elif index == 7:
                page.mouse.move(228, 88, steps=2)
            elif index == 8:
                page.mouse.move(247, 82, steps=2)
            elif index == 9:
                page.mouse.move(276, 73, steps=2)
            elif index == 10:
                page.mouse.up()
            elif index == 13:
                page.locator('[data-action="grow"]').click()
            elif index == 16:
                page.locator('[data-action="grow"]').click()
            elif index == 19:
                page.locator("#growth-progress").focus()
                page.keyboard.press("ArrowRight")
                page.keyboard.press("ArrowRight")
            elif index == 22:
                page.locator("#forest-stage").focus()
                page.keyboard.press("[")
            elif index == 24:
                page.keyboard.press("ArrowDown")
        elif demo["id"] == "pointer-woven-ribbon-loom":
            if index == 3:
                page.mouse.move(70, 70)
            elif index == 5:
                page.mouse.move(120, 95)
            elif index == 7:
                page.mouse.move(150, 95)
                page.mouse.down()
            elif index == 8:
                page.mouse.move(180, 80)
            elif index == 9:
                page.mouse.move(210, 100)
            elif index == 10:
                page.mouse.move(240, 75)
            elif index == 11:
                page.mouse.up()
            elif index == 14:
                page.locator('[data-material="1"]').click()
            elif index == 17:
                page.locator("#loom-tension").focus()
                page.keyboard.press("ArrowRight")
                page.keyboard.press("ArrowRight")
            elif index == 19:
                page.locator('[data-action="commit"]').click()
            elif index == 22:
                page.locator('[data-action="next"]').click()
            elif index == 24:
                page.locator('[data-action="commit"]').click()
            elif index == 27:
                page.locator('[data-action="undo"]').click()
            elif index == 30:
                page.locator("#loom-stage").focus()
                page.keyboard.press("ArrowLeft")
                page.keyboard.press("ArrowUp")
            elif index == 33:
                page.locator('[data-action="reset"]').click()
        elif demo["id"] == "traveling-dot-headline-rewriter":
            if index == 4:
                page.locator('[data-revision="shared-clarity"]').click()
            elif index == 24:
                page.locator('#undo-revision').click()
        elif demo["id"] == "dom-synced-shader-planes":
            if index == 2:
                page.mouse.move(118, 82)
            elif index == 4:
                page.locator('#scale-control').focus()
                page.keyboard.press('Home')
            elif index == 7:
                page.mouse.move(92, 100)
            elif index == 8:
                page.mouse.down()
            elif index == 9:
                page.mouse.move(108, 95, steps=2)
            elif index == 10:
                page.mouse.move(126, 88, steps=2)
            elif index == 11:
                page.mouse.move(145, 80, steps=2)
            elif index == 12:
                page.mouse.move(160, 73, steps=2)
            elif index == 13:
                page.mouse.up()
            elif index == 17:
                page.locator('[data-layout-action="review"]').click()
            elif index == 21:
                page.locator('#shader-card').focus()
                page.keyboard.press('ArrowLeft')
            elif index == 22:
                page.keyboard.press('ArrowUp')
            elif index == 25:
                page.keyboard.press('+')
            elif index == 29:
                page.locator('[data-layout-action="edit"]').click()
            elif index == 33:
                page.locator('#reset-registration').click()
        elif demo["id"] == "prompt-select-replace-loop":
            if index == 3:
                page.mouse.move(42, 113)
            elif index == 4:
                page.mouse.down()
            elif index == 5:
                page.mouse.move(82, 113)
            elif index == 6:
                page.mouse.move(128, 113)
            elif index == 7:
                page.mouse.up()
            elif index == 12:
                page.locator('[data-option="0"]').click()
            elif index == 18:
                page.locator('#apply-revision').click()
        elif demo["id"] == "self-inverting-fixed-navigation":
            if index == 5:
                page.mouse.move(150, 170)
            elif index == 6:
                page.mouse.down()
            elif index == 7:
                page.mouse.move(150, 140)
            elif index == 8:
                page.mouse.move(150, 105)
            elif index == 9:
                page.mouse.move(150, 70)
            elif index == 10:
                page.mouse.move(150, 35)
            elif index == 11:
                page.mouse.move(150, 5)
            elif index == 12:
                page.mouse.up()
            elif index == 18:
                page.locator('[data-section="2"]').click()
            elif index == 25:
                page.locator('#reader-viewport').focus()
                page.keyboard.press('Home')
        elif demo["id"] == "infinite-curved-text-conveyor":
            if index == 3:
                page.mouse.move(45, 100)
                page.mouse.down()
            elif index == 4:
                page.mouse.move(78, 98, steps=2)
            elif index == 5:
                page.mouse.move(112, 94, steps=2)
            elif index == 6:
                page.mouse.move(150, 90, steps=2)
            elif index == 7:
                page.mouse.move(190, 87, steps=2)
            elif index == 8:
                page.mouse.move(230, 84, steps=2)
            elif index == 9:
                page.mouse.up()
            elif index == 26:
                page.locator('#route-field').focus()
                page.keyboard.press('Home')
        elif demo["id"] == "staggered-multichart-telemetry-boot":
            if index == 3:
                page.locator('#run-preflight').click()
        elif demo["id"] == "poisson-constellation-bloom":
            if index == 2:
                page.mouse.move(170, 92)
            elif index == 4:
                page.mouse.move(168, 110)
                page.mouse.down()
            elif index == 5:
                page.mouse.move(190, 96, steps=3)
            elif index == 6:
                page.mouse.move(215, 80, steps=3)
            elif index == 7:
                page.mouse.move(242, 68, steps=3)
            elif index == 8:
                page.mouse.up()
            elif index == 11:
                page.locator("#pin-button").click()
            elif index == 14:
                page.locator("#reach-range").focus()
                page.keyboard.press("ArrowRight")
            elif index == 17:
                page.locator("#reset-button").click()
            elif index == 20:
                page.mouse.move(220, 90)
            elif index == 21:
                page.locator("#graph-host").focus()
                page.keyboard.press("ArrowRight")
            elif index == 22:
                page.keyboard.press("ArrowUp")
            elif index == 24:
                page.keyboard.press("Enter")
        elif demo["id"] == "svg-metaball-cursor-separation":
            if index == 2:
                page.mouse.move(112, 90)
            elif index == 4:
                page.mouse.move(112, 90)
                page.mouse.down()
            elif index == 5:
                page.mouse.move(155, 76, steps=2)
            elif index == 6:
                page.mouse.move(205, 92, steps=2)
            elif index == 7:
                page.mouse.move(258, 108, steps=2)
            elif index == 8:
                page.mouse.move(300, 96, steps=2)
            elif index == 9:
                page.mouse.up()
            elif index == 12:
                page.locator('[data-sort-action="merge"]').click()
            elif index == 15:
                page.locator('[data-sort-action="separate"]').click()
            elif index == 18:
                page.locator('[data-sort-action="lock"]').click()
            elif index == 21:
                page.locator("#reclaim-stage").focus()
                page.keyboard.press("Enter")
            elif index == 23:
                page.keyboard.press("Escape")
            elif index == 26:
                page.keyboard.press("End")
            elif index == 29:
                page.keyboard.press("Enter")
        elif demo["id"] == "kinetic-paper-fold-map":
            if index == 1:
                page.mouse.move(280, 100)
            elif index == 2:
                page.mouse.down()
            elif index == 3:
                page.mouse.move(230, 95, steps=3)
            elif index == 4:
                page.mouse.move(180, 95, steps=3)
            elif index == 5:
                page.mouse.move(130, 95, steps=3)
            elif index == 6:
                page.mouse.up()
            elif index == 9:
                page.locator('[data-destination="1"]').click()
            elif index == 11:
                page.locator('[data-destination="2"]').click()
            elif index == 13:
                page.locator('[data-destination="0"]').click()
            elif index == 15:
                page.locator('[data-fold="open"]').click()
            elif index == 18:
                page.locator("#expansion-stage").focus()
                page.keyboard.press("End")
            elif index == 20:
                page.keyboard.press("ArrowLeft")
            elif index == 22:
                page.keyboard.press("ArrowRight")
            elif index == 24:
                page.keyboard.press("2")
            elif index == 26:
                page.keyboard.press("3")
            elif index == 28:
                page.keyboard.press("Home")
            elif index == 30:
                page.locator('[data-fold="folded"]').click()
            elif index == 32:
                page.locator('[data-fold="open"]').click()
            elif index == 34:
                page.locator("#expansion-stage").focus()
                page.keyboard.press("1")
        elif demo["id"] == "cursor-heatmap-crystallization":
            if index == 1:
                page.mouse.move(160, 90)
            elif index == 3:
                page.mouse.move(100, 70, steps=4)
            elif index == 6:
                page.mouse.move(80, 80)
            elif index == 7:
                page.mouse.down()
            elif index == 8:
                page.mouse.move(140, 55, steps=4)
            elif index == 9:
                page.mouse.move(210, 90, steps=4)
            elif index == 10:
                page.mouse.move(170, 120, steps=4)
            elif index == 11:
                page.mouse.up()
            elif index == 14:
                page.locator("#thermal-stage").focus()
                page.keyboard.press("ArrowLeft")
            elif index == 15:
                page.keyboard.press("ArrowUp")
            elif index == 16:
                page.keyboard.press("Space")
            elif index in (18, 21):
                page.locator('[data-thermal-action="pulse"]').click()
            elif index in (24, 27):
                page.locator('[data-thermal-action="cool"]').click()
            elif index == 30:
                page.locator('[data-thermal-action="reset"]').click()
        elif demo["id"] == "iris-aperture-navigation":
            if index == 1:
                page.mouse.move(250, 100)
            elif index == 4:
                page.mouse.move(180, 70, steps=4)
            elif index == 7:
                page.mouse.move(100, 120)
            elif index == 8:
                page.mouse.down()
            elif index == 9:
                page.mouse.move(190, 45, steps=6)
            elif index == 10:
                page.mouse.up()
            elif index == 13:
                page.locator('[data-chapter="0"]').click()
            elif index == 15:
                page.locator('[data-chapter="2"]').click()
            elif index == 17:
                page.locator('[data-chapter="1"]').click()
            elif index == 20:
                page.locator("#iris-open").click()
            elif index == 22:
                page.locator("#iris-close").click()
            elif index == 24:
                page.locator("#iris-canvas").focus()
                page.keyboard.press("ArrowRight")
            elif index == 26:
                page.keyboard.press("ArrowUp")
            elif index == 28:
                page.keyboard.press("Home")
            elif index == 30:
                page.keyboard.press("End")
            elif index == 32:
                page.keyboard.press("ArrowLeft")
            elif index == 34:
                page.keyboard.press("ArrowDown")
        elif demo["id"] == "liquid-lens-card-refraction":
            if index == 1:
                page.mouse.move(260, 110)
            elif index == 4:
                page.mouse.move(80, 60, steps=4)
            elif index == 7:
                page.mouse.move(100, 120)
            elif index == 8:
                page.mouse.down()
            elif index == 9:
                page.mouse.move(220, 70, steps=6)
            elif index == 10:
                page.mouse.up()
            elif index in (13, 15):
                page.locator('[data-lens-action="zoom-in"]').click()
            elif index == 17:
                page.locator('[data-lens-action="zoom-out"]').click()
            elif index == 20:
                page.locator("#inspection-stage").focus()
                page.keyboard.press("ArrowLeft")
            elif index == 21:
                page.keyboard.press("ArrowUp")
            elif index == 23:
                page.keyboard.press("+")
            elif index == 25:
                page.keyboard.press("ArrowRight")
            elif index == 27:
                page.keyboard.press("Home")
            elif index == 30:
                page.locator('[data-lens-action="zoom-in"]').click()
            elif index == 32:
                page.locator('[data-lens-action="reset"]').click()
        elif demo["id"] == "orbital-card-constellation":
            if index == 1:
                page.mouse.move(160, 100)
            elif index == 2:
                page.mouse.down()
            elif index == 3:
                page.mouse.move(230, 66, steps=8)
            elif index == 4:
                page.mouse.up()
            elif index == 8:
                page.locator("#mode-control").click()
            elif index == 11:
                page.locator("#evidence-control").click()
            elif index == 14:
                page.locator("#constellation-host").focus()
                page.keyboard.press("ArrowLeft")
            elif index == 16:
                page.keyboard.press("ArrowUp")
            elif index == 18:
                page.keyboard.press("]")
            elif index == 20:
                page.keyboard.press("[")
            elif index == 22:
                page.keyboard.press("g")
            elif index == 24:
                page.keyboard.press("g")
            elif index == 27:
                page.keyboard.press("Enter")
        elif demo["id"] == "peelable-paper-corner-reveal":
            handle_box = page.locator("#peel-handle").bounding_box()
            ticket_box = page.locator("#ticket").bounding_box()
            if not handle_box or not ticket_box:
                raise RuntimeError("peelable-paper-corner-reveal controls have no visible geometry")
            handle_x = handle_box["x"] + handle_box["width"] / 2
            handle_y = handle_box["y"] + handle_box["height"] / 2
            if index == 1:
                page.mouse.move(handle_x, handle_y)
            elif index == 2:
                page.mouse.down()
            elif index == 3:
                page.mouse.move(handle_x - 12, handle_y - 5, steps=3)
            elif index == 4:
                page.mouse.up()
            elif index == 5:
                page.wait_for_timeout(360)
            elif index == 7:
                page.mouse.move(handle_x, handle_y)
            elif index == 8:
                page.mouse.down()
            elif index == 9:
                page.mouse.move(
                    handle_x - ticket_box["width"] * .22,
                    handle_y - ticket_box["height"] * .14,
                    steps=5,
                )
            elif index == 10:
                page.mouse.up()
            elif index == 13:
                page.mouse.move(handle_x, handle_y)
            elif index == 14:
                page.mouse.down()
            elif index == 15:
                page.mouse.move(
                    handle_x - ticket_box["width"] * .58,
                    handle_y - ticket_box["height"] * .38,
                    steps=6,
                )
            elif index == 16:
                page.mouse.up()
            elif index == 17:
                page.wait_for_timeout(360)
            elif index == 20:
                page.locator("#peel-handle").focus()
                page.keyboard.press("Home")
            elif index == 21:
                page.keyboard.press("ArrowRight")
            elif index == 22:
                page.keyboard.press("ArrowUp")
            elif index == 23:
                page.keyboard.press("End")
            elif index == 25:
                page.locator("#peel-toggle").click()
            elif index == 26:
                page.wait_for_timeout(360)
            elif index == 29:
                page.locator("#peel-toggle").click()
            elif index == 30:
                page.wait_for_timeout(360)
        elif demo["id"] == "pixel-sort-hover-wipe":
            if index == 1:
                page.mouse.move(96, 88)
            elif index == 3:
                page.mouse.move(96, 92)
                page.mouse.down()
            elif index == 4:
                page.mouse.move(178, 92, steps=4)
            elif index == 5:
                page.mouse.move(270, 92, steps=4)
            elif index == 6:
                page.mouse.up()
            elif index == 8:
                page.mouse.move(280, 102)
                page.mouse.down()
            elif index == 9:
                page.mouse.move(176, 102, steps=4)
            elif index == 10:
                page.mouse.move(64, 102, steps=4)
            elif index == 11:
                page.mouse.up()
            elif index == 13:
                page.locator('[data-sort-mode="hue"]').click()
            elif index == 15:
                page.locator('#sort-stage').focus()
                page.keyboard.press("Home")
            elif index == 17:
                page.keyboard.press("End")
            elif index == 19:
                page.keyboard.press("1")
            elif index == 21:
                page.keyboard.press("2")
            elif index in (23, 25):
                page.keyboard.press("ArrowLeft")
            elif index == 27:
                page.keyboard.press("Home")
            elif index == 29:
                page.keyboard.press("ArrowRight")
            elif index == 31:
                page.keyboard.press("End")
            elif index == 33:
                page.locator('[data-sort-mode="luma"]').click()
            elif index == 34:
                page.locator('[data-sort-mode="hue"]').click()
        elif demo["id"] == "accordion-image-slices":
            if index == 2:
                page.mouse.move(95, 94)
                page.mouse.down()
            elif index == 3:
                page.mouse.move(178, 94, steps=4)
            elif index == 4:
                page.mouse.move(296, 94, steps=4)
            elif index == 5:
                page.mouse.up()
            elif index == 8:
                page.mouse.move(288, 104)
                page.mouse.down()
            elif index == 9:
                page.mouse.move(176, 104, steps=4)
            elif index == 10:
                page.mouse.move(46, 104, steps=4)
            elif index == 11:
                page.mouse.up()
            elif index == 13:
                page.locator('#accordion-canvas').focus()
                page.keyboard.press("End")
            elif index == 15:
                page.keyboard.press("Home")
            elif index == 17:
                page.keyboard.press("PageUp")
            elif index == 19:
                page.keyboard.press("ArrowRight")
            elif index == 21:
                page.keyboard.press("PageUp")
            elif index == 23:
                page.keyboard.press("End")
            elif index == 26:
                page.keyboard.press("ArrowLeft")
            elif index == 28:
                page.keyboard.press("Home")
            elif index in (30, 32):
                page.keyboard.press("PageUp")
            elif index == 34:
                page.keyboard.press("End")
        elif demo["id"] == "slider-controlled-exploded-3d-assembly":
            if index == 1:
                page.mouse.move(68, 92)
            elif index == 2:
                page.mouse.down()
            elif index == 3:
                page.mouse.move(148, 92, steps=6)
            elif index == 4:
                page.mouse.up()
            elif index == 8:
                page.locator('.part-control[data-part-index="5"]').click()
            elif index == 12:
                page.locator("#assembly-range").focus()
                page.keyboard.press("End")
            elif index == 16:
                page.locator("#assembly-host").focus()
                page.keyboard.press("3")
            elif index == 18:
                page.keyboard.press("ArrowLeft")
            elif index == 20:
                page.keyboard.press("Home")
            elif index == 22:
                page.keyboard.press("End")
            elif index == 25:
                page.locator("#reset-control").click()
            elif index == 28:
                page.locator("#assembly-range").focus()
                page.keyboard.press("ArrowRight")
            elif index == 30:
                page.keyboard.press("End")
            elif index == 33:
                page.locator("#reset-control").click()
        elif demo["id"] == "collision-reactive-3d-physics-stack":
            if index == 1:
                page.locator('[data-payload="fragile"]').click()
            elif index == 3:
                page.mouse.click(128, 58)
            elif index == 5:
                page.wait_for_timeout(520)
            elif index == 8:
                page.wait_for_timeout(360)
            elif index == 10:
                page.locator('#jolt-button').click()
            elif index == 11:
                page.wait_for_timeout(500)
            elif index == 14:
                page.wait_for_timeout(500)
            elif index == 18:
                page.locator('#reset-button').click()
            elif index == 20:
                page.locator('#physics-host').focus()
                page.keyboard.press("2")
            elif index in (21, 22):
                page.keyboard.press("ArrowRight")
            elif index == 23:
                page.keyboard.press("Space")
            elif index == 24:
                page.wait_for_timeout(520)
            elif index == 28:
                page.wait_for_timeout(360)
            elif index == 30:
                page.locator('[data-payload="fragile"]').click()
            elif index == 31:
                page.locator('#drop-button').click()
            elif index == 32:
                page.wait_for_timeout(520)
            elif index == 34:
                page.locator('#jolt-button').click()
            elif index == 35:
                page.wait_for_timeout(620)
        elif demo["id"] == "curved-3d-text-orbit":
            if index == 2:
                page.mouse.move(112, 92)
                page.mouse.down()
            elif index in (3, 4):
                page.mouse.move(266, 92, steps=5)
            elif index == 5:
                page.mouse.up()
            elif index == 8:
                page.mouse.move(258, 102)
                page.mouse.down()
            elif index in (9, 10):
                page.mouse.move(78, 102, steps=5)
            elif index == 11:
                page.mouse.up()
            elif index == 13:
                page.mouse.wheel(0, 96)
            elif index == 15:
                page.locator('#orbit-text-host').focus()
                page.keyboard.press("ArrowRight")
            elif index == 16:
                page.keyboard.press("PageDown")
            elif index == 18:
                page.locator('#depth-control').focus()
                for _ in range(4):
                    page.keyboard.press("ArrowUp")
            elif index == 21:
                page.locator('#inspect-control').click()
            elif index == 24:
                page.locator('#reset-control').click()
            elif index == 27:
                page.locator('#orbit-text-host').focus()
                page.keyboard.press("ArrowLeft")
            elif index == 28:
                page.keyboard.press("PageUp")
            elif index == 31:
                page.keyboard.press("Enter")
            elif index == 35:
                page.wait_for_timeout(420)
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
        elif demo["id"] == "live-hand-landmark-video-overlay":
            if index == 2:
                page.locator('#play-button').click()
            elif index in (3, 4):
                page.wait_for_timeout(360)
            elif index == 5:
                page.locator('#play-button').click()
            elif index == 7:
                box = page.locator('#seek-input').bounding_box()
                page.mouse.move(box["x"] + 2, box["y"] + box["height"] * .5)
                page.mouse.down()
            elif index == 8:
                box = page.locator('#seek-input').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .56, box["y"] + box["height"] * .5, steps=4)
            elif index == 9:
                box = page.locator('#seek-input').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .82, box["y"] + box["height"] * .5, steps=3)
                page.mouse.up()
            elif index == 10:
                page.wait_for_timeout(350)
            elif index == 11:
                page.locator('#hold-button').click()
            elif index == 13:
                page.mouse.move(222, 104)
                page.mouse.down()
            elif index == 14:
                page.mouse.move(236, 112, steps=3)
            elif index == 15:
                page.mouse.move(250, 120, steps=3)
            elif index == 16:
                page.mouse.up()
            elif index == 18:
                page.locator('#hand-frame').focus()
                page.keyboard.press("ArrowLeft")
            elif index == 19:
                page.keyboard.press("ArrowRight")
            elif index == 20:
                page.keyboard.press("e")
            elif index == 21:
                page.locator('#seek-input').focus()
                page.keyboard.press("Home")
                page.wait_for_timeout(120)
                page.locator('#hand-frame').focus()
                page.keyboard.press("Space")
            elif index == 22:
                page.wait_for_timeout(420)
            elif index == 23:
                page.keyboard.press("Space")
            elif index == 25:
                page.locator('#hand-frame').focus()
                page.keyboard.press("r")
            elif index == 27:
                page.locator('#hold-button').click()
            elif index == 29:
                page.mouse.move(222, 112)
                page.mouse.down()
            elif index == 30:
                page.mouse.move(208, 105, steps=3)
            elif index == 31:
                page.mouse.move(194, 98, steps=3)
            elif index == 32:
                page.mouse.up()
            elif index == 33:
                page.locator('#hand-frame').focus()
                page.keyboard.press("ArrowRight")
            elif index == 34:
                page.locator('#seek-input').focus()
                page.keyboard.press("End")
            elif index == 35:
                page.wait_for_timeout(350)
        elif demo["id"] == "pixel-grid-content-dissolve":
            if index == 2:
                page.locator('#tree-toggle').click()
            elif index in (3, 4):
                page.wait_for_timeout(400)
            elif index == 6:
                page.locator('#dissolve-stage').focus()
                page.keyboard.press("Home")
            elif index in (7, 8):
                page.wait_for_timeout(400)
            elif index == 10:
                page.mouse.move(80, 92)
                page.mouse.down()
            elif index == 11:
                page.mouse.move(115, 92, steps=4)
            elif index == 12:
                page.mouse.up()
            elif index in (13, 14):
                page.wait_for_timeout(360)
            elif index == 16:
                page.mouse.move(58, 105)
                page.mouse.down()
            elif index in (17, 18):
                page.mouse.move(268, 105, steps=5)
            elif index == 19:
                page.mouse.up()
            elif index in (20, 21):
                page.wait_for_timeout(400)
            elif 22 <= index <= 29:
                page.locator('#dissolve-stage').focus()
                page.keyboard.press("ArrowLeft")
            elif index == 30:
                page.wait_for_timeout(240)
            elif index == 31:
                page.keyboard.press("ArrowLeft")
            elif index == 32:
                page.wait_for_timeout(360)
            elif index == 34:
                page.locator('#tree-toggle').click()
            elif index == 35:
                page.wait_for_timeout(760)
        elif demo["id"] == "scroll-controlled-video-scrubbing":
            if index in (2, 4, 6, 8, 10, 12, 14, 15):
                page.mouse.wheel(0, 520)
            elif index == 16:
                page.wait_for_timeout(320)
            elif index == 17:
                page.mouse.wheel(0, 520)
            elif index == 18:
                page.locator('#reset-control').click()
            elif index == 19:
                page.wait_for_timeout(260)
            elif index == 20:
                page.mouse.move(160, 46)
                page.mouse.down()
            elif index == 21:
                page.mouse.move(160, 100, steps=4)
            elif index == 22:
                page.mouse.move(160, 152, steps=4)
            elif index == 23:
                page.mouse.up()
            elif index == 24:
                page.wait_for_timeout(260)
            elif index == 25:
                page.mouse.move(160, 150)
                page.mouse.down()
            elif index == 26:
                page.mouse.move(160, 104, steps=4)
            elif index == 27:
                page.mouse.move(160, 62, steps=4)
            elif index == 28:
                page.mouse.up()
            elif index == 29:
                page.wait_for_timeout(260)
            elif index == 30:
                page.locator('.chapter-button[data-progress="1"]').click()
            elif index == 31:
                page.wait_for_timeout(260)
            elif index == 32:
                page.locator('#video-stage').focus()
                page.keyboard.press("3")
            elif index == 33:
                page.wait_for_timeout(260)
            elif index == 34:
                page.keyboard.press("ArrowRight")
            elif index == 35:
                page.wait_for_timeout(260)
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
        elif demo["id"] == "dom-aware-drag-spawned-fish-flock":
            if index == 3:
                box = page.locator('#flock-stage').bounding_box()
                page.mouse.move(box["x"] + box["width"] * .07, box["y"] + box["height"] * .70)
                page.mouse.down()
                page.mouse.move(
                    box["x"] + box["width"] * .93,
                    box["y"] + box["height"] * .36,
                    steps=24,
                )
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
        if demo["id"] not in {
            "emergent-particle-life-colonies",
            "velocity-reactive-marquee",
            "draggable-dome-gallery",
            "bending-webgl-gallery-ribbon",
            "live-hand-landmark-video-overlay",
            "scroll-controlled-video-scrubbing",
        }:
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
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-multi-agent-evidence-delivery-to-one-shared-artifact"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "trusted-checkpoint-selection-moves-one-named-cursor-and-commits-its-evidence-only-after-the-cursor-reaches-the-measured-artifact-socket"
            or interaction["assetStrategy"] != "code-native-dom-geometry-cursors-and-evidence-state-no-functional-raster-input-required"
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialStaticVerified"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["automaticFallback"]
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
            or interaction["deliveryCommitCount"] != 5
            or interaction["cancelledDeliveryCount"] != 1
            or interaction["prematureCommitCount"] != 0
            or interaction["deliveryCommitCount"] != interaction["motionCompletionCount"] + interaction["reducedMotionDirectCount"]
            or interaction["motionControlCount"] != 5
            or interaction["artifactUpdateCount"] != interaction["selectionCount"]
            or interaction["stageSelectionCounts"] != {"discover": 2, "compose": 2, "verify": 2}
            or interaction["stageOrder"] != ["discover", "compose", "verify"]
            or interaction["agentOrder"] != ["scout", "maker", "critic"]
            or interaction["evidenceOrder"] != ["interview-moments", "narrative-v3", "claim-checklist"]
            or interaction["selectedStage"] != "compose"
            or interaction["selectedAgent"] != "maker"
            or interaction["selectedEvidence"] != "narrative-v3"
            or interaction["committedStage"] != "compose"
            or interaction["committedAgent"] != "maker"
            or interaction["committedEvidence"] != "narrative-v3"
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
    elif demo["id"] == "interaction-history-hiring-badge":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        runtime_assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        pressed = page.locator('[data-role-id]').evaluate_all("nodes => nodes.map(node => node.getAttribute('aria-pressed'))")
        if (
            not runtime_assertion
            or interaction["automaticPlayback"]
            or interaction["automaticCycle"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or not interaction["userInitiatedChangesOnly"]
            or interaction["syntheticInput"]
            or not interaction["initialStaticVerified"]
            or not interaction["geometryValidated"]
            or not interaction["fullStageValidated"]
            or not interaction["motionControlReady"]
            or interaction["inputCount"] != 4
            or interaction["pointerInputCount"] != 4
            or interaction["keyboardInputCount"] != 0
            or interaction["roleSelectionCount"] != 3
            or interaction["undoCount"] != 1
            or interaction["clearCount"] != 0
            or interaction["escapeUndoCount"] != 0
            or interaction["historyLength"] != 2
            or interaction["history"] != ["product", "creative"]
            or interaction["matchedRoleIds"] != ["product", "creative"]
            or interaction["badgePhase"] != "remembering"
            or interaction["lastSelectedRole"] != "creative"
            or interaction["lastTrustedEvent"] != "pointer-undo"
            or interaction["transitionStartCount"] < 4
            or interaction["transitionCompleteCount"] != interaction["transitionStartCount"]
            or interaction["transitionActive"]
            or interaction["finiteTransitionStepCount"] < 20
            or interaction["motionControlCreateCount"] < 10
            or pressed != ["true", "true", "false"]
            or page.locator('.history-node[data-filled="true"]').count() != 2
            or page.locator('#interest-count').inner_text().strip() != "2 / 3"
            or page.locator('#interest-badge').get_attribute('data-ready') != "false"
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real, reversible role-interest hiring memory: {interaction!r}")
    elif demo["id"] == "opposed-diagonal-offset-cta":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        runtime_assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        cta_text = page.locator('#cta-copy').inner_text().strip()
        stock_text = page.locator('#stock-rail').inner_text().strip()
        pressed = page.locator('#offset-button').get_attribute('aria-pressed')
        if (
            not runtime_assertion
            or interaction["task"] != "human-controlled-limited-edition-cta-registration"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["assetStrategy"] != "code-native-print-layers-no-functional-raster-input-required"
            or interaction["automaticPlayback"]
            or interaction["automaticCycle"]
            or interaction["automaticLoop"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["previewClockMutationBeforeInput"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or interaction["reserved"]
            or interaction["pendingReserved"] is not None
            or interaction["transactionActive"]
            or interaction["finalStatus"] != "ready-to-reserve"
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerActivationCount"] != 2
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["transactionStartCount"] != 2
            or interaction["transactionCompleteCount"] != 2
            or interaction["reservationCommitCount"] != 1
            or interaction["reservationReleaseCount"] != 1
            or interaction["contentMutationCount"] != 2
            or interaction["prematureCommitCount"] != 0
            or interaction["canceledTransactionCount"] != 0
            or not interaction["opposedSeparationVerified"]
            or not interaction["registrationContactVerified"]
            or not interaction["deferredCommitVerified"]
            or interaction["finiteTransitionStepCount"] < 16
            or interaction["motionControlCreateCount"] != 4
            or interaction["motionSeekCount"] < 60
            or not interaction["geometryValidated"]
            or interaction["stageCoverageRatio"] < .75
            or cta_text.casefold() != "hold an edition"
            or stock_text.casefold() != "12 copies remain"
            or pressed != "false"
        ):
            raise RuntimeError(
                f"{demo['id']} did not capture a real deferred print-registration reservation and release: "
                f"state={interaction!r}; runtime={runtime_assertion!r}; cta={cta_text!r}; stock={stock_text!r}; pressed={pressed!r}"
            )
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
    elif demo["id"] == "scrubbed-word-blur-rotate-reveal":
        interaction = page.evaluate("window.__SCRUBBED_WORD_REVEAL_STATE__")
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        expected_words = ["TEAMS", "MOVED", "FASTER", "WHEN", "EVERY", "HANDOFF", "ENDED", "WITH", "ONE", "VISIBLE,", "SHARED", "DECISION."]
        if (
            not assertion
            or interaction["task"] != "human-scrubs-field-note-conclusion-to-stable-readable-copy"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "paused-motion-word-controls-map-trusted-wheel-drag-or-keyboard-progress-to-ordered-blur-rotate-reveal-and-retain-the-human-selected-reading-position"
            or interaction["assetStrategy"] != "dom-typography-and-motion-filters-no-functional-raster-input-required"
            or interaction["causality"] != "trusted-human-input-directly-controls-progress"
            or interaction["automaticPlayback"]
            or interaction["automaticProgress"]
            or interaction["automaticReset"]
            or interaction["automaticFallback"]
            or not interaction["previewClockIgnored"]
            or interaction["syntheticInputDispatch"]
            or interaction["inputCount"] != 8
            or interaction["trustedInputCount"] != 8
            or interaction["wheelInputCount"] != 8
            or interaction["progressInputCount"] != 8
            or interaction["pointerInputCount"] != 0
            or interaction["keyboardInputCount"] != 0
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["untrustedMutationCount"] != 0
            or interaction["progressMutationCount"] != 8
            or interaction["progress"] != 1
            or interaction["progressPercent"] != 100
            or interaction["minimumProgress"] != 0
            or interaction["maximumProgress"] != 1
            or interaction["phase"] != "complete-retained"
            or interaction["result"] != "field-note-conclusion-fully-readable"
            or not interaction["resultRetained"]
            or not interaction["complete"]
            or interaction["completionCount"] != 1
            or interaction["currentChapter"] != 3
            or interaction["wordCount"] != 12
            or interaction["revealedWordCount"] != 12
            or interaction["completedWordCount"] != 12
            or interaction["wordOrder"] != expected_words
            or not interaction["wordOrderVerified"]
            or any(progress != 1 for progress in interaction["wordProgress"])
            or len(interaction["inputRecords"]) != 8
            or not all(record["trusted"] and record["source"] == "wheel" and record["category"] == "progress" and record["mutated"] and record["progressBefore"] != record["progressAfter"] for record in interaction["inputRecords"])
            or interaction["firstMutationBefore"] != 0
            or interaction["firstMutationAfter"] != .125
            or not interaction["initialStillVerified"]
            or not interaction["initialSignature"].startswith("0.0000:")
            or interaction["surfaceCoverageRatio"] < .995
            or not interaction["fullStageGeometryVerified"]
            or not interaction["motionControlsReady"]
            or not interaction["fontsReady"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real retained human-scrubbed field-note conclusion: {interaction!r}")
    elif demo["id"] == "bubble-to-navigation-morph":
        page.wait_for_function("window.__PREVIEW_INTERACTION_STATE__.isOpen && window.__PREVIEW_INTERACTION_STATE__.activeAnimationCount === 0 && window.__PREVIEW_INTERACTION_STATE__.morphCompletionCount === 3", timeout=2000)
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        if (
            not assertion
            or interaction["task"] != "human-opens-a-structured-immersive-story-navigation-and-retains-a-section-choice"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "trusted-toggle-morphs-a-compact-bubble-into-large-operable-information-architecture"
            or interaction["assetStrategy"] != "code-native-css-landscape-and-svg-contours-no-functional-raster-input-required"
            or interaction["imageGenerationDecision"] != "omitted-because-raster-imagery-would-be-decorative-and-would-not-drive-navigation-or-morph-geometry"
            or "|".join(interaction["informationArchitecture"]) != "Story|Field Log|Visit"
            or interaction["automaticToggle"]
            or interaction["automaticRehearsal"]
            or interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["syntheticInputDispatch"]
            or interaction["untrustedInputPolicy"] != "reject-before-toggle-or-link-mutation"
            or interaction["untrustedMutationCount"] != 0
            or not interaction["initialStillVerified"]
            or interaction["inputCount"] != 4
            or interaction["trustedInputCount"] != 4
            or interaction["pointerInputCount"] != 4
            or interaction["keyboardInputCount"] != 0
            or interaction["toggleInputCount"] != 3
            or interaction["toggleCount"] != 3
            or interaction["linkInputCount"] != 1
            or interaction["linkActivationCount"] != 1
            or interaction["openCount"] != 2
            or interaction["closeCount"] != 1
            or interaction["morphTransitionCount"] != 3
            or interaction["morphCompletionCount"] != 3
            or interaction["activeAnimationCount"] != 0
            or interaction["lastTransitionDuration"] != .58
            or not interaction["targetOpen"]
            or not interaction["isOpen"]
            or interaction["phase"] != "open-stable"
            or interaction["morphProgress"] != 1
            or not interaction["contentVisible"]
            or page.locator('#nav-toggle').get_attribute('aria-expanded') != "true"
            or interaction["selectedIndex"] != 1
            or interaction["selectedSection"] != "Field Log"
            or interaction["result"] != "field-log-section-retained"
            or interaction["selectionChangeCount"] != 1
            or interaction["selectionRetainedAcrossCloseCount"] < 1
            or page.locator('.nav-link[data-selected="true"]').count() != 1
            or page.locator('#nav-result').text_content() != "FIELD LOG · SELECTED"
            or abs(interaction["expandedWidth"] - 296) > 1
            or abs(interaction["expandedHeight"] - 150) > 1
            or abs(interaction["shellWidth"] - 296) > 1
            or abs(interaction["shellHeight"] - 150) > 1
            or interaction["operableLinkCount"] != 3
            or interaction["minimumLinkHeight"] < 44
            or interaction["minimumLinkWidth"] < 44
            or not interaction["linksWithinShell"]
            or not interaction["shellWithinStage"]
            or interaction["stageCoverageRatio"] < .995
            or len(interaction["transitionRecords"]) != 4
            or not all(record["trusted"] for record in interaction["transitionRecords"])
            or interaction["renderCount"] <= 0
            or interaction["geometryMeasureCount"] <= 0
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real retained Field Atlas section choice through a finite bubble navigation morph: {interaction!r}")
    elif demo["id"] == "drag-thrown-card-stack":
        interaction = page.evaluate("window.__THROW_STACK_STATE__")
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        pixel_signatures = interaction["cropPixelSignatures"]
        if (
            not assertion
            or interaction["task"] != "human-release-velocity-settles-a-rental-card-or-advances-the-shortlist-with-retained-decisions"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "trusted-drag-samples-real-release-velocity-then-finite-motion-settlement-either-restores-the-card-or-transfers-active-order-to-the-next-listing"
            or interaction["assetStrategy"] != "one-imagegen-triptych-is-cropped-into-three-functional-listing-identities-and-verified-by-distinct-runtime-pixel-signatures"
            or interaction["assetGenerationTool"] != "openai-built-in-imagegen"
            or interaction["assetSha256"] != "7e443914677b8439cd18048b3ad26381e54b49b7c0237f8ecad7224d72568efd"
            or interaction["automaticThrow"]
            or interaction["automaticPlayback"]
            or interaction["automaticCycle"]
            or interaction["automaticTimeline"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["phase"] != "advanced"
            or interaction["settlementKind"] != "fast-pass"
            or interaction["landingZone"] != "passed-right"
            or interaction["activeCardIndex"] != 1
            or interaction["previousListingId"] != "cedar-cove"
            or interaction["activeListingId"] != "atlas-loft"
            or interaction["inputCount"] != interaction["trustedInputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerDownCount"] != 2
            or interaction["pointerMoveCount"] != 4
            or interaction["pointerUpCount"] != 2
            or interaction["pointerCaptured"]
            or interaction["pointerCaptureCount"] != 2
            or interaction["pointerCaptureReleaseCount"] != 2
            or interaction["releaseSampleCount"] != 2
            or interaction["releaseSpeed"] < .52
            or interaction["slowSettlementCount"] != 1
            or interaction["fastSettlementCount"] != 1
            or interaction["settlementStartCount"] != 2
            or interaction["settlementCompleteCount"] != 2
            or interaction["motionControlCount"] != 3
            or interaction["motionStartCount"] != 3
            or interaction["motionCompleteCount"] != 3
            or not all(record["completed"] and record["trusted"] and 0 < record["duration"] <= .62 for record in interaction["motionRecords"])
            or interaction["retainedDecisionCount"] != 2
            or interaction["heldDecisionCount"] != 1
            or interaction["passedDecisionCount"] != 1
            or len(interaction["decisionHistory"]) != 2
            or [decision["kind"] for decision in interaction["decisionHistory"]] != ["slow-hold", "fast-pass"]
            or any(decision["listingId"] != "cedar-cove" for decision in interaction["decisionHistory"])
            or interaction["cardsAdvancedCount"] != 1
            or interaction["orderTakeoverCount"] != 1
            or not interaction["resultHeld"]
            or not interaction["resultValidated"]
            or not interaction["imageReady"]
            or interaction["imageNaturalWidth"] != 1200
            or interaction["imageNaturalHeight"] != 800
            or interaction["imageAspectRatio"] != 1.5
            or interaction["imageReferenceCount"] != 3
            or interaction["cropIndices"] != [2, 1, 0]
            or len(pixel_signatures) != 3
            or len(set(pixel_signatures)) != 3
            or any(len(signature.rsplit(':', 1)[-1]) != 8 or any(character not in "0123456789abcdef" for character in signature.rsplit(':', 1)[-1]) for signature in pixel_signatures)
            or not interaction["initialStillVerified"]
            or interaction["humanMutationCount"] <= 0
            or interaction["nonInputMutationCount"] != 0
            or not (.3 <= interaction["geometryCoverageX"] <= .98)
            or not (.35 <= interaction["geometryCoverageY"] <= .9)
        ):
            raise RuntimeError(f"{demo['id']} did not capture real slow-hold and fast-pass rental decisions with a retained card-order takeover: {interaction!r}")
    elif demo["id"] == "layered-staggered-full-screen-menu":
        interaction = page.evaluate("window.__LAYERED_EDITORIAL_MENU_STATE__")
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        if (
            not assertion
            or interaction["task"] != "human-opens-north-common-index-selects-field-notes-and-receives-retained-page-result"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "trusted-toggle-drives-three-paused-motion-underplates-and-staggered-links-then-a-trusted-link-selection-reverses-the-stack-before-committing-the-page-result"
            or interaction["assetStrategy"] != "imagegen-editorial-cover-is-rendered-in-menu-preview-and-retained-selected-page-result"
            or interaction["imageSourceType"] != "imagegen-built-in"
            or interaction["imagePublishedSha256"] != "ec7ed6b2553ea86cb9c863d84d4faa3d347cdd7de7ddb63ff8b33013de3c29c5"
            or interaction["imageNaturalWidth"] != 800
            or interaction["imageNaturalHeight"] != 1000
            or interaction["imageElementCount"] != 2
            or not interaction["imageLoaded"]
            or not interaction["imageUsedInClosedPage"]
            or not interaction["imageUsedInMenuPreview"]
            or interaction["causality"] != "trusted-human-input-only"
            or interaction["automaticPlayback"]
            or interaction["automaticOpen"]
            or interaction["automaticClose"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or not interaction["previewClockOnlyAdvancesHumanStartedTransition"]
            or interaction["syntheticInputDispatch"]
            or interaction["inputCount"] != 2
            or interaction["trustedInputCount"] != 2
            or interaction["pointerInputCount"] != 2
            or interaction["keyboardInputCount"] != 0
            or interaction["toggleInputCount"] != 1
            or interaction["selectionInputCount"] != 1
            or interaction["navigationInputCount"] != 0
            or interaction["escapeInputCount"] != 0
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["untrustedMutationCount"] != 0
            or interaction["lastInputKind"] != "link-pointer-select"
            or interaction["lastInputTrusted"] is not True
            or interaction["menuProgress"] != 0
            or interaction["targetProgress"] != 0
            or interaction["transitionFrom"] != 1
            or interaction["transitionTo"] != 0
            or interaction["transitionActive"]
            or interaction["layerProgress"] != [0, 0, 0]
            or interaction["itemProgress"] != [0, 0, 0, 0]
            or interaction["previewProgress"] != 0
            or interaction["phase"] != "closed-selected"
            or interaction["result"] != "field-notes-selected-and-retained"
            or not interaction["resultRetained"]
            or interaction["pendingSelection"] is not None
            or interaction["selectedSection"] != "field-notes"
            or interaction["selectedTitle"] != "Field Notes"
            or interaction["openStartCount"] != 1
            or interaction["openCompletionCount"] != 1
            or interaction["closeStartCount"] != 1
            or interaction["closeCompletionCount"] != 1
            or interaction["reversalCount"] != 0
            or interaction["withdrawalCount"] != 0
            or interaction["selectionAttemptCount"] != 1
            or interaction["selectionCommitCount"] != 1
            or interaction["prematureCommitCount"] != 0
            or len(interaction["transitionRecords"]) != 2
            or not all(record["trusted"] and record["completed"] for record in interaction["transitionRecords"])
            or interaction["transitionFrameCount"] < 10
            or interaction["linkOrder"] != ["field-notes", "dispatches", "material-index", "about"]
            or not interaction["linkOrderVerified"]
            or not interaction["initialStillVerified"]
            or not interaction["controlsReady"]
            or not interaction["fontsReady"]
            or not interaction["ready"]
            or not interaction["fullStageGeometryVerified"]
            or any(ratio < .995 for ratio in interaction["layerCoverageRatios"])
            or len(interaction["imagePublishedSha256"]) != 64
            or page.locator('#page-kicker').text_content() != "FIELD NOTES / SELECTED"
            or page.locator('#page-title').text_content() != "Field studies, kept in motion."
            or page.locator('#page-deck').text_content() != "The section is now retained behind the closed index, ready for reading."
            or page.locator('#result-label').text_content() != "FIELD NOTES · READY"
            or page.locator('#issue-result').get_attribute('data-selected') != "true"
            or page.locator('#full-menu').get_attribute('aria-hidden') != "true"
            or page.locator('#menu-toggle').get_attribute('aria-expanded') != "false"
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real delayed-commit NORTH/COMMON Field Notes navigation transaction: {interaction!r}")
    elif demo["id"] == "snapping-target-reticle-cursor":
        page.wait_for_function("window.__PREVIEW_INTERACTION_STATE__.springSettled && window.__PREVIEW_INTERACTION_STATE__.confirmedDefectId === 'FST-09'", timeout=2000)
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        history_signature = [(record["action"], record["id"]) for record in interaction["annotationHistory"]]
        expected_samples = [("COR-17", .735, .205), ("CRK-04", .535, .532), ("FST-09", .347, .817)]
        sample_signature = [(sample["id"], sample["u"], sample["v"]) for sample in interaction["targetPixelSamples"]]
        spring = interaction["springConfiguration"]
        if (
            not assertion
            or interaction["task"] != "human-inspector-snaps-confirms-reviews-undoes-and-reselects-a-pixel-evidenced-defect-annotation"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "trusted-pointer-proximity-or-keyboard-focus-springs-a-reticle-to-pixel-derived-inspection-targets"
            or interaction["assetStrategy"] != "imagegen-functional-inspection-pixels-define-target-coordinates-and-browser-sampled-evidence"
            or interaction["causality"] != "trusted-human-input-only"
            or interaction["automaticCruise"]
            or interaction["automaticTour"]
            or interaction["automaticSnap"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["syntheticInputDispatch"]
            or interaction["untrustedInputPolicy"] != "reject-before-reticle-or-annotation-mutation"
            or interaction["untrustedMutationCount"] != 0
            or not interaction["initialStillVerified"]
            or not interaction["initialVisualSignature"]
            or interaction["inputCount"] != 11
            or interaction["trustedInputCount"] != 11
            or interaction["pointerInputCount"] != 9
            or interaction["keyboardInputCount"] != 2
            or interaction["pointerProximityInputCount"] != 4
            or interaction["keyboardNavigationCount"] != 1
            or interaction["focusInputCount"] != 2
            or interaction["confirmationInputCount"] != 3
            or interaction["undoInputCount"] != 1
            or interaction["proximityEvaluationCount"] != 4
            or interaction["measuredDistanceCount"] != 21
            or interaction["measuredDistances"] != [108, 54, 0]
            or interaction["nearestDistance"] != 0
            or abs(interaction["snapRadius"] - 41.4) > .1
            or interaction["snapAcquisitionCount"] != 10
            or interaction["freeReticleMoveCount"] != 0
            or interaction["reticleMotionCount"] != 10
            or interaction["reticleMotionCompletionCount"] < 4
            or not interaction["springSettled"]
            or spring != {"type": "spring", "stiffness": 360, "damping": 27, "mass": .6}
            or interaction["previewIndex"] != 2
            or interaction["previewDefectId"] != "FST-09"
            or interaction["confirmedIndex"] != 2
            or interaction["confirmedDefectId"] != "FST-09"
            or interaction["confirmedDefectKind"] != "damaged-fastener"
            or not interaction["annotationRetained"]
            or interaction["confirmationCount"] != 3
            or interaction["undoCount"] != 1
            or interaction["reselectionCount"] != 1
            or interaction["reselectionAfterUndoCount"] != 1
            or interaction["selectionChangeCount"] != 3
            or interaction["selectionRetainedAcrossPreviewCount"] < 4
            or interaction["phase"] != "annotation-retained"
            or interaction["result"] != "FST-09-review-annotation-retained"
            or history_signature != [("confirm", "CRK-04"), ("confirm", "COR-17"), ("undo", "COR-17"), ("confirm", "FST-09")]
            or not all(record["trusted"] for record in interaction["annotationHistory"])
            or page.locator('#annotation-pin').get_attribute('data-visible') != "true"
            or page.locator('#undo-annotation').is_disabled()
            or page.locator('#review-output').text_content() != "VERIFIED · FST-09"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 336992
            or interaction["assetSha256"] != "6007175702fd26c5104db0fc0ca05d562ce6aaceac41c33dfa74ab15af16cea8"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["imageNaturalWidth"] != 1280
            or interaction["imageNaturalHeight"] != 720
            or interaction["provenanceFetchCount"] != 1
            or not interaction["provenanceVerified"]
            or interaction["generationProvider"] != "OpenAI built-in image generation"
            or interaction["generationPromptId"] != "graphite-panel-three-defects-v1"
            or interaction["generatedAt"] != "2026-07-21"
            or interaction["generatedOriginalSize"] != [1672, 941]
            or sample_signature != expected_samples
            or interaction["sampledPatchPixelCount"] != 75
            or not interaction["pixelEvidenceReady"]
            or not interaction["functionalAssetUseVerified"]
            or interaction["targetPixelLuminanceSpread"] <= .03
            or interaction["targetPixelEvidenceChecksum"] <= 0
            or interaction["targetGeometryCount"] != 3
            or interaction["maximumTargetAlignmentError"] > 1
            or not interaction["targetsWithinVisibleImage"]
            or not interaction["fullStageGeometryVerified"]
            or interaction["stageCoverageRatio"] < .995
            or interaction["backgroundAssetCoverageRatio"] < .995
            or abs(interaction["reticleX"] - 111.04) > 1
            or abs(interaction["reticleY"] - 147.06) > 1
            or abs(interaction["targetReticleX"] - 111.04) > 1
            or abs(interaction["targetReticleY"] - 147.06) > 1
            or not all(record["trusted"] for record in interaction["transitionRecords"])
            or interaction["renderCount"] <= 0
            or interaction["geometryMeasureCount"] <= 0
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real retained pixel-evidenced FST-09 defect annotation after reselect and undo: {interaction!r}")
    elif demo["id"] == "clip-shape-theme-reveal":
        interaction = page.evaluate("window.__READER_THEME_STATE__")
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        pixel_signatures = interaction["imageCropPixelSignatures"]
        transition_signature = [(record["direction"], record["from"], record["to"]) for record in interaction["transitionRecords"]]
        if (
            not assertion
            or interaction["task"] != "human-switches-between-functional-research-and-focus-reader-modes-through-an-origin-aware-finite-clip-reveal-and-withdrawal"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "trusted-click-tap-or-keyboard-selection-computes-the-invocation-origin-and-finite-motion-radius-needed-to-cover-or-withdraw-the-focus-reader-layer"
            or interaction["assetStrategy"] != "one-imagegen-diptych-provides-two-distinct-functional-reader-mode-crops-verified-by-runtime-pixel-signatures"
            or interaction["assetGenerationTool"] != "openai-built-in-imagegen"
            or interaction["assetSha256"] != "03b7131211b5d53c9106c670b82228b22857e5ca4d8c055ca6f1e3f10c73d054"
            or interaction["automaticDayNightCycle"]
            or interaction["automaticThemeSelection"]
            or interaction["automaticPlayback"]
            or interaction["automaticTimeline"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["phase"] != "retained"
            or interaction["selectedTheme"] != "research"
            or interaction["previousTheme"] != "focus"
            or interaction["targetTheme"] != "research"
            or interaction["transitioning"]
            or not interaction["resultHeld"]
            or not interaction["resultValidated"]
            or interaction["inputCount"] != 3
            or interaction["trustedInputCount"] != 3
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerThemeInputCount"] != 2
            or interaction["keyboardThemeInputCount"] != 0
            or interaction["keyboardFocusInputCount"] != 1
            or interaction["originSource"] != "trusted-pointer-invocation"
            or not interaction["originInsideStage"]
            or interaction["clipRadius"] != 0
            or interaction["clipProgress"] != 1
            or interaction["transitionStartCount"] != 2
            or interaction["transitionCompleteCount"] != 2
            or interaction["themeChangeCount"] != 2
            or interaction["motionControlCount"] != 2
            or interaction["motionStartCount"] != 2
            or interaction["motionCompleteCount"] != 2
            or interaction["forwardRevealCount"] != 1
            or interaction["reverseWithdrawCount"] != 1
            or interaction["focusLineIndex"] != 3
            or interaction["focusLineChangeCount"] != 1
            or interaction["focusModeEngagementCount"] != 1
            or len(interaction["transitionRecords"]) != 2
            or transition_signature != [("forward-reveal", "research", "focus"), ("reverse-withdraw", "focus", "research")]
            or not all(record["trusted"] and record["completed"] and record["retained"] for record in interaction["transitionRecords"])
            or page.locator('#focus-mode').get_attribute('aria-hidden') != "true"
            or interaction["researchAnnotationCount"] != 1
            or interaction["researchChapterMapCount"] != 3
            or interaction["researchLineCount"] != 5
            or interaction["focusAnnotationCount"] != 0
            or interaction["focusToolCount"] != 1
            or interaction["focusLineCount"] != 5
            or interaction["focusLineHeight"] <= interaction["researchLineHeight"]
            or not interaction["functionalDifferenceValidated"]
            or not interaction["imageReady"]
            or interaction["imageNaturalWidth"] != 1200
            or interaction["imageNaturalHeight"] != 800
            or interaction["imageAspectRatio"] != 1.5
            or interaction["imageReferenceCount"] != 2
            or interaction["imageCropIndices"] != [0, 1]
            or len(pixel_signatures) != 2
            or len(set(pixel_signatures)) != 2
            or any(len(signature.rsplit(':', 1)[-1]) != 8 or any(character not in "0123456789abcdef" for character in signature.rsplit(':', 1)[-1]) for signature in pixel_signatures)
            or abs(interaction["researchWidth"] - interaction["stageWidth"]) > 1
            or abs(interaction["researchHeight"] - interaction["stageHeight"]) > 1
            or abs(interaction["focusWidth"] - interaction["stageWidth"]) > 1
            or abs(interaction["focusHeight"] - interaction["stageHeight"]) > 1
            or interaction["layerCoverageX"] < .995
            or interaction["layerCoverageY"] < .995
            or not interaction["initialStillVerified"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real origin-aware round trip between functionally distinct Research and Focus reader modes: {interaction!r}")
    elif demo["id"] == "animated-dom-node-connection-beam":
        interaction = page.evaluate("window.__DOM_CONNECTION_PIPELINE_STATE__")
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        if (
            not assertion
            or interaction["task"] != "human-routes-site-audit-file-through-ai-parser-and-explicitly-sends-it-to-review"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "real-domrect-boundary-intersections-recompute-two-svg-beziers-after-trusted-drag-keyboard-or-layout-input-and-an-explicit-send-moves-one-finite-packet-before-committing-review"
            or interaction["assetStrategy"] != "code-native-dom-svg-and-file-metadata-no-functional-raster-input-required"
            or interaction["causality"] != "trusted-human-input-only"
            or interaction["automaticPlayback"]
            or interaction["automaticDrift"]
            or interaction["automaticPulse"]
            or interaction["automaticSend"]
            or interaction["automaticFallback"]
            or not interaction["previewClockOnlyAdvancesHumanStartedTransitions"]
            or interaction["syntheticInputDispatch"]
            or interaction["inputCount"] != 2
            or interaction["trustedInputCount"] != 2
            or interaction["pointerInputCount"] != 2
            or interaction["keyboardInputCount"] != 0
            or interaction["layoutInputCount"] != 1
            or interaction["sendInputCount"] != 1
            or interaction["dragInputCount"] != 0
            or interaction["keyboardMoveInputCount"] != 0
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["untrustedMutationCount"] != 0
            or interaction["lastInputKind"] != "send-pointer"
            or interaction["lastInputTrusted"] is not True
            or interaction["layout"] != "stack"
            or interaction["targetLayout"] != "stack"
            or interaction["layoutTransitionActive"]
            or interaction["layoutTransitionProgress"] != 1
            or interaction["layoutStartCount"] != 1
            or interaction["layoutCompletionCount"] != 1
            or interaction["layoutFrameCount"] < 4
            or len(interaction["layoutRecords"]) != 1
            or interaction["layoutRecords"][0]["from"] != "flow"
            or interaction["layoutRecords"][0]["to"] != "stack"
            or not interaction["layoutRecords"][0]["trusted"]
            or not interaction["layoutRecords"][0]["completed"]
            or interaction["humanGeometryMutationCount"] != 1
            or interaction["geometryMeasureCount"] <= 4
            or interaction["routeRevisionCount"] <= 4
            or interaction["pathCount"] != 2
            or not all(length > 6 for length in interaction["pathLengths"])
            or interaction["pathGeometrySignature"].count('C') != 2
            or len(interaction["anchors"]) != 2
            or len(interaction["nodeBounds"]) != 3
            or not interaction["anchorBoundaryVerified"]
            or interaction["anchorRegistrationMaxError"] != 0
            or interaction["transferActive"]
            or interaction["transferProgress"] != 1
            or interaction["sendStartCount"] != 1
            or interaction["processorReceiptCount"] != 1
            or interaction["arrivalCount"] != 1
            or interaction["transferFrameCount"] < 5
            or interaction["transferDuration"] != 1.12
            or interaction["packetLeg"] != "arrived"
            or interaction["packetRegistrationError"] != 0
            or interaction["payloadSignature"] != "site-audit.pdf:24-pages:1.8mb:schema-a11y-performance-content"
            or not interaction["payloadRetained"]
            or interaction["phase"] != "complete-retained"
            or interaction["result"] != "site-audit-structured-review-ready"
            or not interaction["resultRetained"]
            or interaction["reviewResult"] != "18-findings-3-priority-review-ready"
            or interaction["reviewFindingCount"] != 18
            or interaction["reviewPriorityCount"] != 3
            or interaction["prematureResultCount"] != 0
            or len(interaction["transferRecords"]) != 1
            or not interaction["transferRecords"][0]["trusted"]
            or not interaction["transferRecords"][0]["arrived"]
            or not interaction["transferRecords"][0]["committed"]
            or interaction["transferRecords"][0]["payloadSignature"] != interaction["payloadSignature"]
            or not interaction["initialStillVerified"]
            or not interaction["fullStageGeometryVerified"]
            or interaction["svgCoverageRatio"] < .995
            or not interaction["motionControlReady"]
            or not interaction["fontsReady"]
            or not interaction["ready"]
            or page.locator('#result-panel').get_attribute('data-ready') != "true"
            or page.locator('#result-title').text_content() != "18 FINDINGS · REVIEW READY"
            or page.locator('#result-detail').text_content() != "3 priority checks retained for human review."
            or page.locator('#review-title').text_content() != "Review ready"
            or page.locator('#review-meta').text_content() != "3 priority items"
            or page.locator('.beam-path.active').count() != 0
            or page.locator('#send-packet').is_disabled()
            or page.locator('#layout-toggle').is_disabled()
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real DOM-bound site-audit packet transfer with an arrival-gated review result: {interaction!r}")
    elif demo["id"] == "sticky-paragraph-ink-reveal":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        expected_words = ["Across", "42", "monitored", "courtyards,", "tree", "shade", "reduced", "peak", "surface", "temperature", "by", "11.8°C,", "while", "comfortable", "seating", "use", "lasted", "37", "minutes", "longer."]
        if (
            not assertion
            or interaction["task"] != "human-reads-reviews-and-retains-a-sequential-research-evidence-conclusion"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "trusted-wheel-drag-or-keyboard-progress-controls-paused-motion-word-ink-in-document-order"
            or interaction["assetStrategy"] != "code-native-dom-research-text-directly-defines-word-order-and-evidence-no-raster-input-required"
            or interaction["imageGenerationDecision"] != "omitted-because-a-bitmap-would-not-drive-word-order-scroll-distance-or-reading-evidence"
            or interaction["causality"] != "trusted-human-input-only"
            or interaction["automaticFill"]
            or interaction["automaticReset"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["syntheticInputDispatch"]
            or interaction["untrustedInputPolicy"] != "reject-before-reading-progress-mutation"
            or interaction["untrustedMutationCount"] != 0
            or interaction["inputCount"] != 12
            or interaction["trustedInputCount"] != 12
            or interaction["wheelInputCount"] != 2
            or interaction["pointerInputCount"] != 8
            or interaction["keyboardInputCount"] != 2
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] != 6
            or interaction["pointerUpCount"] != 1
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["dragActive"]
            or interaction["activePointerId"] is not None
            or interaction["lastInputKind"] != "keyboard-end"
            or interaction["lastInputTrusted"] is not True
            or interaction["progressMutationCount"] != 10
            or interaction["forwardMutationCount"] != 9
            or interaction["backwardMutationCount"] != 1
            or interaction["reviewBacktrackCount"] != 1
            or interaction["completionCount"] != 1
            or interaction["returnToStartCount"] != 0
            or interaction["progress"] != 1
            or interaction["maximumProgress"] != 1
            or abs(interaction["minimumProgressAfterAdvance"] - .18) > .001
            or not interaction["conclusionRetained"]
            or interaction["phase"] != "conclusion-retained"
            or interaction["result"] != "shade-extends-safe-use-conclusion-retained"
            or interaction["wordCount"] != 20
            or interaction["motionControlCount"] != 20
            or not interaction["controlsPausedAtConstruction"]
            or interaction["emphasizedWordCount"] != 5
            or interaction["revealedWordCount"] != 20
            or interaction["fullyRevealedWordCount"] != 20
            or interaction["wordSequence"] != expected_words
            or not interaction["wordOrderVerified"]
            or any(progress != 1 for progress in interaction["wordProgress"])
            or interaction["activeEvidenceIndex"] != 4
            or interaction["activeEvidenceId"] != "conclusion"
            or interaction["evidenceStagesVisited"] != ["method", "sample-size", "surface-temperature", "dwell-time", "conclusion"]
            or interaction["evidenceTransitionCount"] != 6
            or page.locator('#evidence-card').get_attribute('data-complete') != "true"
            or page.locator('#evidence-output').text_content() != "SHADE EXTENDS SAFE USE"
            or interaction["scrollTop"] != 600
            or interaction["scrollRange"] != 600
            or not interaction["scrollProgressMatchesState"]
            or interaction["initialProgress"] != 0
            or interaction["initialScrollTop"] != 0
            or not interaction["initialStillVerified"]
            or not interaction["initialWordSignature"]
            or interaction["stageWidth"] != 320
            or interaction["stageHeight"] != 180
            or interaction["stageCoverageRatio"] < .995
            or not interaction["stickyPositionVerified"]
            or not interaction["stickyWithinStage"]
            or not interaction["textReadable"]
            or not interaction["fullStageGeometryVerified"]
            or len(interaction["transitionRecords"]) != 10
            or not all(record["trusted"] for record in interaction["transitionRecords"])
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real bidirectional research-evidence review with a retained shade conclusion: {interaction!r}")
    elif demo["id"] == "voronoi-nearest-point-hover-focus":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        audit_actions = [record["action"] for record in interaction["auditTrail"]]
        if (
            not assertion
            or interaction["task"] != "human-attributes-a-city-air-event-to-the-mathematically-nearest-authored-sensor-and-retains-a-reviewable-reading-decision"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "trusted-pointer-or-keyboard-selection-queries-voronoi-cells-derived-from-real-data-coordinates-and-explicit-confirmation-retains-or-revises-the-reading"
            or interaction["assetStrategy"] != "code-native-authored-sensor-coordinates-and-half-plane-voronoi-geometry-are-the-functional-input-no-raster-asset-required"
            or interaction["causality"] != "trusted-human-input-only"
            or interaction["automaticTraversal"]
            or interaction["automaticSelection"]
            or interaction["automaticConfirmation"]
            or interaction["automaticPlayback"]
            or interaction["automaticCycle"]
            or interaction["automaticTimeline"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["phase"] != "reviewing-selection"
            or interaction["activeStationIndex"] != 1
            or interaction["activeStationId"] != "NW-03"
            or interaction["activeDistrict"] != "Foundry"
            or interaction["activeReading"] != 31
            or interaction["cursorDataX"] != .28
            or interaction["cursorDataY"] != .12
            or interaction["nearestDistanceData"] != 0
            or interaction["nearestDistanceKm"] != 0
            or not interaction["nearestSelectionVerified"]
            or interaction["selectionCount"] != 6
            or interaction["inputCount"] != 7
            or interaction["trustedInputCount"] != 7
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerMoveCount"] != 4
            or interaction["pointerConfirmCount"] != 2
            or interaction["undoButtonCount"] != 1
            or interaction["keyboardSelectionCount"] != 0
            or interaction["keyboardConfirmCount"] != 0
            or interaction["keyboardUndoCount"] != 0
            or interaction["confirmCount"] != 2
            or interaction["reselectionCount"] != 1
            or interaction["undoCount"] != 1
            or interaction["retainedDecisionCount"] != 1
            or interaction["decisionStackDepth"] != 1
            or interaction["confirmedStationId"] != "NW-03"
            or interaction["confirmedReading"] != 31
            or interaction["lastUndoRemovedStation"] != "SE-08"
            or interaction["lastUndoRestoredStation"] != "NW-03"
            or len(interaction["decisionStack"]) != 1
            or interaction["decisionStack"][0]["stationId"] != "NW-03"
            or not interaction["decisionStack"][0]["trusted"]
            or not interaction["decisionStack"][0]["retained"]
            or interaction["auditTrailCount"] != 3
            or audit_actions != ["confirm", "confirm", "undo"]
            or interaction["auditTrail"][0]["stationId"] != "NW-03"
            or interaction["auditTrail"][1]["stationId"] != "SE-08"
            or interaction["auditTrail"][2]["restoredStationId"] != "NW-03"
            or not interaction["resultHeld"]
            or not interaction["resultValidated"]
            or interaction["stationCount"] != 12
            or interaction["voronoiCellCount"] != 12
            or interaction["voronoiVertexCounts"] != [5, 4, 5, 6, 4, 6, 6, 4, 6, 4, 5, 6]
            or interaction["voronoiMinimumVertexCount"] != 4
            or interaction["voronoiAreaSum"] != 1
            or interaction["dataReadingSum"] != 283
            or not interaction["cellOwnershipVerified"]
            or abs(interaction["canvasWidth"] - interaction["hostWidth"]) > 1
            or abs(interaction["canvasHeight"] - interaction["hostHeight"]) > 1
            or interaction["canvasCoverageX"] < .995
            or interaction["canvasCoverageY"] < .995
            or len(interaction["stationScreenPositions"]) != 12
            or not all(interaction["plotLeft"] <= point["x"] <= interaction["plotRight"] and interaction["plotTop"] <= point["y"] <= interaction["plotBottom"] for point in interaction["stationScreenPositions"])
            or not interaction["initialStillVerified"]
            or len(interaction["initialPixelHash"]) != 8
            or any(character not in "0123456789abcdef" for character in interaction["initialPixelHash"])
            or interaction["initialPixelHash"] == "00000000"
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real confirm-reselect-undo city-air attribution with retained NW-03 evidence: {interaction!r}")
    elif demo["id"] == "linked-brush-to-zoom-chart":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        if (
            not assertion
            or interaction["task"] != "human-isolates-recomputes-and-retains-a-bearing-vibration-anomaly-window"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "trusted-overview-brush-or-keyboard-range-recomputes-the-focus-chart-over-the-identical-time-domain"
            or interaction["assetStrategy"] != "code-native-deterministic-bearing-telemetry-no-functional-raster-input-required"
            or interaction["imageGenerationDecision"] != "omitted-because-raster-pixels-would-not-define-or-recompute-the-time-series-domain"
            or interaction["causality"] != "trusted-human-input-only"
            or interaction["automaticWindowTravel"]
            or interaction["automaticRoundTrip"]
            or interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["syntheticInputDispatch"]
            or interaction["untrustedInputPolicy"] != "reject-before-brush-or-decision-mutation"
            or interaction["untrustedMutationCount"] != 0
            or interaction["sourceDataSampleCount"] != 144
            or interaction["sourceDataChecksum"] != 2192331280
            or interaction["sourceDataMinimum"] != 1.721
            or interaction["sourceDataMaximum"] != 7.15
            or interaction["sourceAnomalyThreshold"] != 4.5
            or interaction["sourceAnomalySampleCount"] != 12
            or not interaction["dataDeterministic"]
            or interaction["dataRandomness"]
            or not interaction["initialStillVerified"]
            or interaction["initialSelectionSignature"] != "0.12|0.36"
            or interaction["inputCount"] != 14
            or interaction["trustedInputCount"] != 14
            or interaction["pointerInputCount"] != 9
            or interaction["keyboardInputCount"] != 4
            or interaction["controlInputCount"] != 1
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] != 7
            or interaction["pointerUpCount"] != 1
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["ignoredPointerCount"] != 0
            or interaction["rangeMutationCount"] != 10
            or interaction["pointerRangeMutationCount"] != 7
            or interaction["keyboardRangeMutationCount"] != 3
            or interaction["backwardReviewCount"] != 1
            or abs(interaction["maximumSelectionEnd"] - .72) > .001
            or interaction["keyboardAdjustmentCount"] != 1
            or interaction["resetCount"] != 1
            or interaction["anomalyPresetCount"] != 1
            or interaction["commitInputCount"] != 2
            or interaction["commitCount"] != 2
            or interaction["decisionClearCount"] != 1
            or interaction["firstHumanSelectionBefore"] != [.12, .36]
            or interaction["firstHumanSelectionAfter"] != [.42, .58]
            or interaction["selection"] != [.42, .58]
            or interaction["minimumSelectionWidth"] != .08
            or interaction["dragActive"]
            or interaction["activePointerId"] is not None
            or interaction["dragMode"] is not None
            or interaction["focusStartIndex"] != 60
            or interaction["focusEndIndex"] != 83
            or interaction["focusSampleCount"] != 24
            or interaction["focusMinimum"] != 2.667
            or interaction["focusMaximum"] != 7.15
            or interaction["focusPeakIndex"] != 71
            or interaction["focusAnomalySampleCount"] != 12
            or interaction["focusDomainLabel"] != "10:00 — 13:50"
            or not interaction["linkedDomainVerified"]
            or interaction["retainedSelection"] != [.42, .58]
            or interaction["retainedStartIndex"] != 60
            or interaction["retainedEndIndex"] != 83
            or interaction["retainedPeak"] != 7.15
            or interaction["retainedAnomalySampleCount"] != 12
            or interaction["retainedConclusion"] != "bearing-b7-anomaly-review-required"
            or not interaction["decisionRetained"]
            or interaction["phase"] != "range-decision-retained"
            or interaction["result"] != "bearing-b7-anomaly-review-required"
            or interaction["focusRecomputeCount"] <= interaction["rangeMutationCount"]
            or interaction["overviewDomainStartIndex"] != 0
            or interaction["overviewDomainEndIndex"] != 143
            or not interaction["p5InstanceReady"]
            or not interaction["canvas2dReady"]
            or interaction["canvasCoverageRatio"] < .995
            or not interaction["fullStageGeometryVerified"]
            or not interaction["brushWithinStage"]
            or not interaction["focusWithinStage"]
            or len(interaction["transitionRecords"]) != 12
            or not all(record["trusted"] for record in interaction["transitionRecords"])
            or page.locator('#decision-card').get_attribute('data-alert') != "true"
            or page.locator('#decision-output').text_content() != "RETAINED · 7.15 MM/S PEAK"
            or interaction["renderCount"] <= 0
            or interaction["drawCount"] <= 0
            or interaction["completedDrawCount"] <= 0
            or interaction["geometryMeasureCount"] <= 0
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real retained Bearing B7 anomaly window through linked brush-domain recomputation: {interaction!r}")
    elif demo["id"] == "draggable-force-directed-svg-network":
        interaction = page.evaluate("window.__DEPENDENCY_GRAPH_STATE__")
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        expected_graph_signature = "auth-api,web-app,mobile-app,billing,user-db,audit-log,notify,deploy-gate|web-app>auth-api:depends-on,mobile-app>auth-api:depends-on,billing>auth-api:depends-on,notify>auth-api:depends-on,deploy-gate>web-app:depends-on,deploy-gate>billing:depends-on,auth-api>user-db:reads,auth-api>audit-log:emits,billing>audit-log:emits"
        if (
            not assertion
            or interaction["task"] != "human-pins-auth-api-runs-one-finite-release-dependency-solve-and-confirms-retained-blast-radius-analysis"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "trusted-drag-or-keyboard-pin-mutates-one-knowledge-graph-node-then-a-bounded-72-step-force-solver-settles-dependent-nodes-before-explicit-human-analysis-confirmation"
            or interaction["assetStrategy"] != "code-native-typed-graph-and-deterministic-physics-no-functional-raster-input-required"
            or interaction["causality"] != "trusted-human-input-only"
            or interaction["automaticPlayback"]
            or interaction["automaticSimulation"]
            or interaction["automaticDrift"]
            or interaction["automaticPulse"]
            or interaction["automaticConfirmation"]
            or interaction["automaticFallback"]
            or not interaction["previewClockOnlyAdvancesHumanStartedSolver"]
            or interaction["syntheticInputDispatch"]
            or interaction["graphNodeCount"] != 8
            or interaction["graphEdgeCount"] != 9
            or interaction["nodeOrder"] != ["auth-api", "web-app", "mobile-app", "billing", "user-db", "audit-log", "notify", "deploy-gate"]
            or interaction["relationTypes"] != ["depends-on", "reads", "emits"]
            or interaction["relationCounts"] != {"depends-on": 6, "reads": 1, "emits": 2}
            or interaction["graphSignature"] != expected_graph_signature
            or len(interaction["nodes"]) != 8
            or interaction["inputCount"] != 6
            or interaction["trustedInputCount"] != 6
            or interaction["pointerInputCount"] != 6
            or interaction["keyboardInputCount"] != 0
            or interaction["dragInputCount"] != 5
            or interaction["confirmInputCount"] != 1
            or interaction["keyboardMoveInputCount"] != 0
            or interaction["undoInputCount"] != 0
            or interaction["resetInputCount"] != 0
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["untrustedMutationCount"] != 0
            or interaction["lastInputKind"] != "confirm-pointer"
            or interaction["lastInputTrusted"] is not True
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] != 3
            or interaction["pointerUpCount"] != 1
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerReleaseCount"] != 1
            or interaction["activePointerId"] is not None
            or interaction["dragAnchor"] is not None
            or interaction["dragDistance"] <= 30
            or interaction["pinNodeId"] != "auth-api"
            or abs(interaction["pinPosition"]["x"] - 207.2) > 1
            or abs(interaction["pinPosition"]["y"] - 115.2) > 1
            or interaction["humanPinCount"] != 1
            or interaction["humanGeometryMutationCount"] != 3
            or not interaction["nodes"][0]["pinned"]
            or abs(interaction["nodes"][0]["x"] - interaction["pinPosition"]["x"]) > .01
            or abs(interaction["nodes"][0]["y"] - interaction["pinPosition"]["y"]) > .01
            or interaction["nodeChecksumCurrent"] == interaction["nodeChecksumInitial"]
            or interaction["firstHumanChecksumBefore"] == interaction["firstHumanChecksumAfter"]
            or interaction["solverActive"]
            or interaction["solverDuration"] != 1.08
            or interaction["solverStepLimit"] != 72
            or interaction["solverStepCount"] != 72
            or interaction["solverStartCount"] != 1
            or interaction["solverCompletionCount"] != 1
            or interaction["solverFrameCount"] < 8
            or len(interaction["solverEnergySamples"]) != 72
            or interaction["solverEnergyInitial"] is None
            or interaction["solverEnergyInitial"] <= 0
            or interaction["solverEnergyFinal"] != 0
            or interaction["solverEnergy"] != 0
            or interaction["solverCompletionReason"] != "bounded-72-step-convergence"
            or len(interaction["solveRecords"]) != 1
            or not interaction["solveRecords"][0]["trusted"]
            or interaction["solveRecords"][0]["sourceKind"] != "pointer-mouse-pin-end"
            or interaction["solveRecords"][0]["pinNodeId"] != "auth-api"
            or interaction["solveRecords"][0]["stepLimit"] != 72
            or interaction["solveRecords"][0]["finalStepCount"] != 72
            or not interaction["solveRecords"][0]["completed"]
            or interaction["solveRecords"][0]["energyFinal"] != 0
            or not interaction["analysisCandidateReady"]
            or interaction["analysisCandidate"] != "auth-api-high-blast-radius-4-direct-dependents"
            or interaction["directDependentCount"] != 4
            or interaction["releasePathCount"] != 4
            or not interaction["conclusionConfirmed"]
            or interaction["confirmationCount"] != 1
            or interaction["prematureConclusionCount"] != 0
            or interaction["phase"] != "confirmed-retained"
            or interaction["result"] != "auth-api-release-critical-analysis-confirmed"
            or not interaction["resultRetained"]
            or interaction["retainedConclusion"] != interaction["analysisCandidate"]
            or len(interaction["confirmationRecords"]) != 1
            or not interaction["confirmationRecords"][0]["trusted"]
            or not interaction["confirmationRecords"][0]["retained"]
            or interaction["confirmationRecords"][0]["sourceKind"] != "confirm-pointer"
            or interaction["historyDepth"] != 2
            or interaction["undoCount"] != 0
            or interaction["resetCount"] != 0
            or interaction["rollbackRecords"] != []
            or not interaction["initialStillVerified"]
            or not interaction["p5InstanceReady"]
            or not interaction["canvas2dReady"]
            or not interaction["ready"]
            or not interaction["fullStageGeometryVerified"]
            or interaction["canvasCoverageRatio"] < .995
            or page.locator('#graph-result').get_attribute('data-confirmed') != "true"
            or page.locator('#result-title').text_content() != "AUTH API · HIGH BLAST RADIUS"
            or page.locator('#result-detail').text_content() != "4 direct dependents · release review retained."
            or page.locator('#state-label').text_content() != "ANALYSIS CONFIRMED · RETAINED"
            or not page.locator('#confirm-analysis').is_disabled()
            or page.locator('#undo-graph').is_disabled()
            or page.locator('#reset-graph').is_disabled()
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real human-pinned bounded dependency solve and retained Auth API blast-radius analysis: {interaction!r}")
    elif demo["id"] == "gooey-pixel-cursor-wake":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        if (
            not assertion
            or interaction["task"] != "human-routed-signal-matrix-safety-path"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "trusted-pointer-touch-or-keyboard-hits-quantized-cells-with-gooey-neighbor-fusion-and-finite-decay"
            or interaction["assetStrategy"] != "code-native-quantized-signal-grid-no-functional-raster-input-required"
            or interaction["gridDefinition"] != "24-columns-by-14-rows"
            or interaction["causality"] != "trusted-human-input-only"
            or interaction["automaticPlayback"]
            or interaction["automaticTrajectory"]
            or interaction["automaticFallback"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["syntheticInputDispatch"]
            or interaction["untrustedInputPolicy"] != "reject-before-mutation"
            or interaction["untrustedMutationCount"] != 0
            or not interaction["initialStillVerified"]
            or interaction["inputCount"] != interaction["trustedInputCount"]
            or interaction["inputCount"] != interaction["pointerInputCount"]
            or interaction["inputCount"] < 16
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 13
            or interaction["pointerUpCount"] != 1
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerReleaseCaptureCount"] != 1
            or interaction["gridHitCount"] < 14
            or interaction["uniqueGridHitCount"] < 12
            or interaction["retainedCellCount"] != interaction["uniqueGridHitCount"]
            or interaction["maximumBridgeCount"] <= 0
            or interaction["decayFrameCount"] < 12
            or interaction["decayedCellCount"] <= 0
            or interaction["settleCompletionCount"] < 1
            or not interaction["routeComplete"]
            or not interaction["resultRetained"]
            or interaction["phase"] != "complete-retained"
            or interaction["result"] != "route-04-locked"
            or not interaction["p5InstanceReady"]
            or not interaction["canvas2dReady"]
            or not interaction["fullStageGeometryVerified"]
            or interaction["canvasCoverageRatio"] < .995
            or interaction["canvasWidth"] != 320
            or interaction["canvasHeight"] != 180
            or interaction["drawCount"] <= 0
            or interaction["completedDrawCount"] <= 0
            or interaction["renderCount"] <= 0
            or not all(record["trusted"] and isinstance(record["mutated"], bool) for record in interaction["transitionRecords"])
            or not any(record["mutated"] for record in interaction["transitionRecords"])
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real retained gooey signal route: {interaction!r}")
    elif demo["id"] == "pointer-reactive-cell-grid":
        interaction = page.evaluate("window.__POINTER_REACTIVE_CELL_GRID_STATE__")
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        if (
            not assertion
            or interaction["task"] != "operator-locates-and-confirms-density-drift-cell-h4"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "trusted-human-proximity-continuously-modulates-a-distance-field-while-an-explicit-confirmation-creates-one-finite-cell-pulse-and-retained-diagnostic-result"
            or interaction["assetStrategy"] != "code-native-deterministic-cell-matrix-no-functional-raster-input-required"
            or interaction["automaticPlayback"]
            or interaction["automaticTrajectory"]
            or interaction["automaticPulse"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["phase"] != "confirmed"
            or interaction["result"] != "cell-h4-density-drift-confirmed"
            or not interaction["resultRetained"]
            or interaction["confirmedCell"] != "H4"
            or interaction["proximityInputCount"] < 2
            or interaction["confirmationInputCount"] != 1
            or interaction["pointerInputCount"] != interaction["inputCount"]
            or interaction["inputCount"] != interaction["trustedInputCount"]
            or interaction["inputCount"] < 3
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["untrustedMutationCount"] != 0
            or interaction["maximumDistanceInfluence"] <= .95
            or interaction["distanceFieldSampleCount"] < 3
            or interaction["distanceFieldSignature"] == "idle"
            or interaction["influencedCellCount"] <= 0
            or interaction["minimumTargetDistance"] is None
            or interaction["minimumTargetDistance"] > 1
            or interaction["pulseStartCount"] != 1
            or interaction["pulseCompletionCount"] != 1
            or interaction["correctConfirmationCount"] != 1
            or interaction["incorrectConfirmationCount"] != 0
            or interaction["activePulseCount"] != 0
            or interaction["pulseProgress"] != 1
            or interaction["transitionFrameCount"] < 4
            or len(interaction["confirmationRecords"]) != 1
            or not interaction["confirmationRecords"][0]["correct"]
            or not interaction["confirmationRecords"][0]["committed"]
            or not interaction["confirmationRecords"][0]["trusted"]
            or not interaction["initialStillVerified"]
            or interaction["canvasCoverageRatio"] < .995
            or not interaction["fullStageGeometryVerified"]
            or not interaction["ready"]
            or not interaction["p5InstanceReady"]
            or not interaction["canvas2dReady"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real proximity scan and finite retained H4 diagnostic: {interaction!r}")
    elif demo["id"] == "cursor-projected-3d-surface-marker":
        interaction = page.evaluate("window.__SURFACE_INSPECTION_STATE__")
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        if (
            not assertion
            or interaction["task"] != "human-locates-a-digital-twin-inspection-zone-and-retains-a-reviewable-normal-aligned-stamp"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["assetStrategy"] != "code-native-deterministic-heightfield-is-the-functional-surface-input-no-raster-input-required"
            or interaction["automaticPath"]
            or interaction["automaticStamping"]
            or interaction["automaticPlayback"]
            or interaction["automaticCycle"]
            or interaction["automaticTimeline"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["phase"] not in ["stamped", "reviewing"]
            or not interaction["engaged"]
            or not interaction["resultHeld"]
            or not interaction["resultValidated"]
            or interaction["inputCount"] != interaction["trustedInputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerMoveCount"] < 4
            or interaction["pointerPressCount"] != 1
            or interaction["projectionSolveCount"] < interaction["pointerMoveCount"]
            or interaction["projectionResidualPx"] >= 3
            or abs(interaction["focusNormalLength"] - 1) >= .0015
            or interaction["normalScreenError"] > .05
            or interaction["acquiredTarget"] != "B"
            or interaction["targetAcquireCount"] < 2
            or interaction["targetCount"] != 3
            or interaction["stampCount"] != 1
            or interaction["stampCreateCount"] != 1
            or interaction["stampPersistenceRenderCount"] < 1
            or interaction["lastStampTarget"] != "B"
            or abs(interaction["lastStampNormalLength"] - 1) >= .0015
            or not interaction["lastStampSignature"].startswith("B:")
            or interaction["surfaceVertexCount"] != 551
            or interaction["surfaceCellCount"] != 504
            or interaction["heightDataSignature"] != "56:5696:-1998:2044"
            or interaction["geometryCoverageX"] < .995
            or interaction["geometryCoverageY"] < .995
            or not interaction["initialStillVerified"]
            or len(interaction["initialPixelHash"]) != 8
            or any(character not in "0123456789abcdef" for character in interaction["initialPixelHash"])
            or interaction["initialPixelHash"] == "00000000"
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real normal-aligned retained digital-twin inspection stamp: {interaction!r}")
    elif demo["id"] == "metaball-blob-cursor":
        interaction = page.evaluate("window.__METABALL_TARGET_STATE__")
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        if (
            not assertion
            or interaction["task"] != "human-selects-and-locks-a-real-product-finish-through-a-liquid-target-bridge"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["assetStrategy"] != "code-native-product-geometry-and-svg-metaball-field-no-functional-raster-input-required"
            or interaction["automaticPath"]
            or interaction["automaticPlayback"]
            or interaction["automaticCycle"]
            or interaction["automaticTimeline"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["phase"] != "locked"
            or interaction["selectedFinish"] != "coral"
            or not interaction["resultHeld"]
            or not interaction["resultValidated"]
            or interaction["inputCount"] != interaction["trustedInputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["targetHoverCount"] < 3
            or interaction["targetHitCount"] != 1
            or interaction["selectionStartCount"] != 1
            or interaction["selectionCompleteCount"] != 1
            or interaction["transitionProgress"] != 1
            or interaction["cursorTravelStartCount"] < 3
            or interaction["cursorTravelCompleteCount"] < 1
            or interaction["maximumBridgeLength"] < 10
            or interaction["mergedFrameCount"] < 1
            or interaction["stretchedFrameCount"] < 1
            or interaction["selectedBridgeFrameCount"] < 1
            or interaction["geometryCoverageX"] < .995
            or interaction["geometryCoverageY"] < .995
            or page.locator('#finish-coral').get_attribute('aria-pressed') != "true"
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real retained finish selection through a liquid target bridge: {interaction!r}")
    elif demo["id"] == "neighbor-magnifying-navigation-dock":
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        scales = interaction["targetScales"]
        peak = max(scales)
        if (
            not assertion
            or interaction["task"] != "human-selects-and-retains-a-design-tool-through-a-distance-weighted-dock"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "measured-pointer-distance-or-keyboard-focus-distributes-motion-scale-across-target-and-neighbors"
            or interaction["assetStrategy"] != "code-native-inline-svg-tool-icons-no-functional-raster-asset-required"
            or interaction["iconSystem"] != "five-consistent-24px-stroke-svg-tools"
            or interaction["causality"] != "trusted-human-input-only"
            or interaction["automaticPlayback"]
            or interaction["automaticCruise"]
            or interaction["automaticFocus"]
            or interaction["automaticFallback"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["syntheticInputDispatch"]
            or interaction["untrustedInputPolicy"] != "reject-before-proximity-or-selection-mutation"
            or interaction["untrustedMutationCount"] != 0
            or not interaction["initialStillVerified"]
            or interaction["svgIconCount"] != 5
            or interaction["svgViewBoxCount"] != 5
            or interaction["stageCoverageRatio"] < .995
            or not interaction["dockWithinStage"]
            or not interaction["allToolsWithinStage"]
            or interaction["inputCount"] != interaction["trustedInputCount"]
            or interaction["pointerMoveCount"] < 6
            or interaction["activationCount"] != 1
            or interaction["activationInputCount"] != 1
            or interaction["selectedIndex"] != 3
            or interaction["selectedTool"] != "Type"
            or interaction["focusedIndex"] != 2
            or interaction["result"] != "type-tool-retained"
            or not interaction["selectionStable"]
            or interaction["selectionChangeCount"] != 1
            or interaction["selectionRetainedAcrossProximityCount"] < 3
            or page.locator('.dock-tool[data-selected="true"]').count() != 1
            or page.locator('#selection-output').text_content() != "TYPE · ACTIVE"
            or interaction["measuredDistanceCount"] < 25
            or len(interaction["measuredDistances"]) != 5
            or len(scales) != 5
            or min(interaction["measuredDistances"]) > 1
            or peak < 1.48
            or scales[2] != peak
            or not any(1.04 < scale < peak for scale in scales)
            or not any(scale <= 1.01 for scale in scales)
            or not interaction["targetPeakVerified"]
            or not interaction["neighborDistributionVerified"]
            or interaction["maximumObservedScale"] < 1.48
            or interaction["minimumObservedScale"] != 1
            or interaction["distributionUpdateCount"] < 5
            or interaction["motionAnimationCount"] < 25
            or not all(record["trusted"] for record in interaction["transitionRecords"])
            or interaction["firstHumanInputScalesBefore"] == interaction["firstHumanInputScalesAfter"]
            or interaction["renderCount"] <= 0
            or interaction["geometryMeasureCount"] <= 0
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real retained design-tool selection through a distance-weighted dock: {interaction!r}")
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
    elif demo["id"] == "scroll-stitched-isometric-blueprint":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-dependency-ordered-field-edge-node-assembly-and-acceptance"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "trusted-scroll-and-captured-vertical-scrub-seek-five-paused-motion-css3d-controls"
            or interaction["moduleOrder"] != ["base-rail", "power-thermal", "compute-chassis", "network-switch", "telemetry-cap"]
            or interaction["moduleCount"] != 5
            or interaction["acceptedInputs"] != ["wheel", "mouse-drag", "touch-drag", "pen-drag", "keyboard", "module-button"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["automaticPath"]
            or interaction["automaticPlayback"]
            or interaction["automaticTimeline"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["inputCount"] != 20
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["wheelInputCount"] != 6
            or interaction["wheelConsumedCount"] != 5
            or interaction["wheelBoundaryReleaseCount"] != 1
            or interaction["pointerInputCount"] != 6
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] != 4
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["dragSessionCount"] != 1
            or interaction["dragMutationCount"] != 4
            or interaction["keyboardInputCount"] != 4
            or interaction["keyboardSeekCount"] != 4
            or interaction["moduleButtonInputCount"] != 4
            or interaction["moduleSelectionCount"] != 4
            or interaction["progressMutationCount"] < 17
            or interaction["humanProgressMutationCount"] != interaction["progressMutationCount"]
            or interaction["nonInputProgressMutationCount"] != 0
            or interaction["humanInputCausalityCount"] != interaction["humanProgressMutationCount"]
            or interaction["minHumanProgress"] != 0
            or interaction["maxHumanProgress"] != 1
            or interaction["maxHumanDelta"] < .99
            or interaction["progress"] != 1
            or interaction["phase"] != "online"
            or interaction["completedModuleCount"] != 5
            or interaction["currentModuleId"] != "acceptance-complete"
            or interaction["moduleLocalProgresses"] != [1, 1, 1, 1, 1]
            or interaction["assemblyOrderViolationCount"] != 0
            or interaction["lastInputKind"] != "wheel"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastWheelDefaultPrevented"] is not False
            or interaction["lastPointerType"] != "mouse"
            or interaction["dragActive"]
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["firstHumanInput"]["kind"] != "wheel"
            or interaction["firstHumanInput"]["before"] != 0
            or abs(interaction["firstHumanInput"]["after"] - .18) > .001
            or interaction["lastHumanInput"]["kind"] != "wheel"
            or interaction["lastHumanInput"]["before"] != 1
            or interaction["lastHumanInput"]["after"] != 1
            or interaction["motionControlCount"] != 5
            or interaction["controlBuildCount"] < 1
            or interaction["controlSeekCount"] < 90
            or interaction["controlTimeSpread"] > .001
            or len(interaction["geometryEndpoints"]) != 5
            or any(endpoint["endX"] != 0 or endpoint["endY"] != 0 for endpoint in interaction["geometryEndpoints"])
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or "image/jpeg" not in interaction["assetMimeType"]
            or interaction["assetByteLength"] != 162992
            or interaction["assetSha256"] != "133ab6080f9c43f720c1c681445b55bb3f82994a724e7910c2e38300c649c424"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["assetDecoded"]
            or interaction["assetNaturalWidth"] != 960
            or interaction["assetNaturalHeight"] != 640
            or interaction["proofImageCount"] != 2
            or interaction["proofImagesDecoded"] != 2
            or not interaction["proofUsesCommittedAsset"]
            or interaction["sampleWidth"] != 96
            or interaction["sampleHeight"] != 64
            or interaction["sampledPixelCount"] != 6144
            or interaction["sampledByteLength"] != 24576
            or len(interaction["sampledPixelSha256"]) != 64
            or interaction["sampledOpaquePixelCount"] != 6144
            or interaction["materialRegionCount"] != 5
            or len(interaction["materialSamples"]) != 5
            or interaction["materialSamplePixelCount"] <= 500
            or interaction["distinctMaterialColorCount"] < 4
            or not interaction["materialBindingsVerified"]
            or interaction["proofReveal"] != 1
            or interaction["renderCount"] < 36
            or interaction["previewClockCallCount"] < 36
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted wheel progress with boundary release, a captured vertical drag, dependency checkpoints, reversible keyboard seeks, five paused Motion controls, and pixel-bound proof over the verified as-built node photo: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "animated-bezier-route-cartography":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-owned-fictional-cold-chain-route-inspection"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["renderer"] != "svg"
            or interaction["mechanism"] != "paused-motion-svg-dash-synchronized-to-bezier-arc-length-position-and-tangent"
            or interaction["acceptedInputs"] != ["mouse-captured-scrub", "touch-captured-scrub", "pen-captured-scrub", "keyboard", "range", "station-control"]
            or not interaction["userInputRequired"]
            or interaction["automaticPlayback"]
            or interaction["automaticTimeline"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or not interaction["renderIgnoresPreviewClock"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStaticVerified"]
            or interaction["initialProgress"] != 0
            or interaction["trustedInputCount"] < 28
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["humanInputCausalityCount"] != interaction["progressMutationCount"]
            or interaction["progressMutationCount"] < 28
            or interaction["progressReversalCount"] < 5
            or interaction["completionReversalCount"] < 3
            or interaction["minHumanProgress"] != 0
            or interaction["maxHumanProgress"] != 1
            or interaction["maxHumanProgressDelta"] < .9
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 12
            or interaction["pointerUpCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureVerifiedCount"] != 1
            or interaction["pointerReleaseCaptureCount"] != 1
            or interaction["mouseInputCount"] < 14
            or interaction["touchInputCount"] != 0
            or interaction["penInputCount"] != 0
            or interaction["keyboardInputCount"] != 5
            or interaction["rangeInputCount"] < 2
            or interaction["stationControlCount"] != 4
            or interaction["activePointerId"] is not None
            or interaction["activePointerType"] != "none"
            or interaction["pointerCaptured"]
            or interaction["lastInputTrusted"] is not True
            or interaction["lastInputKind"] != "panel-station-control"
            or interaction["progress"] != 1
            or interaction["selectedStopIndex"] != 2
            or interaction["selectedStopId"] != "north-clinic"
            or interaction["completedStopCount"] != 3
            or interaction["stationCount"] != 3
            or interaction["stationProgresses"] != [0, .515, 1]
            or any(count < 1 for count in interaction["stationVisitCounts"])
            or interaction["stationHitEventCount"] < 8
            or interaction["lastHitStationId"] != "north-clinic"
            or interaction["routeCommandCount"] < 3
            or interaction["routeLength"] <= 190
            or not interaction["routeLengthStable"]
            or interaction["routePointProbeCount"] != 101
            or interaction["routeTangentProbeCount"] != 101
            or interaction["routeFinitePointCount"] != 101
            or interaction["routeFiniteTangentCount"] != 101
            or interaction["stationPlacementErrorMax"] > .001
            or interaction["routeProjectionSampleCount"] < 3000
            or interaction["routeMotionControlCount"] != 1
            or interaction["routeMotionDuration"] != 1
            or abs(interaction["routeMotionTime"] - 1) > .002
            or interaction["routeMotionProgressError"] > .002
            or interaction["routeDashError"] > .2
            or not interaction["courierTangentFinite"]
            or interaction["assetSourceKind"] != "project-local-imagegen-fictional-checkpoint-atlas"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or not interaction["assetResponseSameOrigin"]
            or "image/jpeg" not in interaction["assetContentType"]
            or interaction["assetByteLength"] != 252082
            or interaction["assetSha256"] != "4511d72d39ff9954a5f4d5aa86fee96e3f4d520babbacca0a0d8208f81751e62"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["assetDecoded"]
            or interaction["assetWidth"] != 960
            or interaction["assetHeight"] != 640
            or interaction["assetCropCount"] != 3
            or interaction["assetPixelSampleCount"] != 12288
            or len(set(interaction["assetCropChecksums"])) != 3
            or any(count < 20 for count in interaction["assetCropDistinctColorBuckets"])
            or any(count < 4 for count in interaction["assetCropCoralPixelCounts"])
            or interaction["assetAlphaFailureCount"] != 0
            or not interaction["assetEvidenceReady"]
            or interaction["previewRenderCount"] < 36
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted reversible route inspection across mouse capture, range, keyboard and three field-evidence checkpoints on one paused Motion arc-length control: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "radial-calendar-time-zoom":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        mutation_total = (
            interaction["hoverMutationCount"]
            + interaction["dragMutationCount"]
            + interaction["keyboardMutationCount"]
            + interaction["buttonMutationCount"]
        )
        if (
            not assertion
            or interaction["task"] != "human-operated-fictional-studio-hour-selection-from-image-sampled-occupancy-atlas"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["renderer"] != "svg"
            or interaction["mechanism"] != "trusted-human-input-seeks-paused-motion-controller-driving-svg-radial-time-needle"
            or interaction["assetMechanismRole"] != "visible-local-atlas-pixels-are-sampled-by-sector-to-classify-each-booking-slot"
            or interaction["acceptedInputs"] != ["mouse-hover", "mouse-drag", "touch-drag", "pen-drag", "keyboard", "button-control"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["inputCount"] < 27
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["hoverMoveCount"] < 2
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 12
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["keyboardInputCount"] != 4
            or interaction["buttonActivationCount"] != 5
            or interaction["hoverMutationCount"] < 1
            or interaction["dragMutationCount"] < 4
            or interaction["keyboardMutationCount"] != 2
            or interaction["buttonMutationCount"] != 3
            or interaction["humanSelectionMutationCount"] != mutation_total
            or interaction["humanInputCausalityCount"] != interaction["humanSelectionMutationCount"]
            or interaction["confirmationCount"] != 3
            or interaction["clearConfirmationCount"] != 2
            or interaction["blockedConfirmationAttemptCount"] != 0
            or interaction["visitedSlotCount"] < 7
            or interaction["visitedSlotCount"] != len(interaction["visitedSlots"])
            or interaction["firstHumanIndexBefore"] != 5
            or interaction["firstHumanIndexAfter"] == 5
            or interaction["lastInputKind"] != "keyboard"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["selectedIndex"] != 2
            or interaction["selectedHour"] != 10
            or interaction["selectedStatus"] != "open"
            or not interaction["confirmed"]
            or interaction["confirmedIndex"] != 2
            or interaction["motionControllerCount"] != 1
            or interaction["motionControllerDuration"] != 1
            or not interaction["motionControllerPaused"]
            or abs(interaction["motionControllerIndex"] - 2) > .03
            or interaction["motionControllerSeekCount"] < 9
            or interaction["motionControllerUpdateCount"] < 9
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or "image/jpeg" not in interaction["assetMimeType"]
            or interaction["assetByteLength"] != 176900
            or interaction["assetSha256"] != "da602594965cf7c28078fabb04edc20bfad72e243ac62778a868f143c5cd5989"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or interaction["sampledWidth"] != 96
            or interaction["sampledHeight"] != 64
            or interaction["sampledPixelCount"] != 6144
            or interaction["sampledPixelByteLength"] != 24576
            or len(interaction["sourcePixelChecksum"]) != 8
            or interaction["distinctSampleColorCount"] <= 500
            or interaction["sampledLumaRange"] <= 180
            or interaction["sectorSamplePixelCount"] != 144
            or len(interaction["sectorSampleChecksum"]) != 8
            or len(interaction["availabilityBySlot"]) != 12
            or any(slot["sampleCount"] != 12 or slot["hour"] != slot["index"] + 8 for slot in interaction["availabilityBySlot"])
            or interaction["availabilityOpenCount"] < 4
            or interaction["availabilityLimitedCount"] < 2
            or interaction["availabilityBlockedCount"] < 2
            or interaction["availabilityOpenCount"] + interaction["availabilityLimitedCount"] + interaction["availabilityBlockedCount"] != 12
            or not interaction["assetEvidenceReady"]
            or interaction["stageCoverageRatio"] <= .96
            or interaction["dialCoverageRatio"] <= .16
            or not interaction["initialStillVerified"]
            or interaction["previewRenderCount"] < 36
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted hover, captured orbit, keyboard and reversible booking controls over twelve image-derived studio-hour states on one paused Motion needle: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "radar-sweep-annotation-reveal":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-fictional-storm-port-thermal-anomaly-inspection"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "committed-multispectral-pixels-cluster-anomalies-and-human-aimed-beam-reveals-their-annotations"
            or interaction["acceptedInputs"] != ["mouse-hover", "mouse-drag", "touch-drag", "pen-drag", "keyboard", "button-control"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or not interaction["userInputRequired"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStaticConfirmed"]
            or interaction["inputCount"] < 23
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerMoveCount"] < 10
            or interaction["pointerDownCount"] != 1
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerReleaseCaptureCount"] != 1
            or interaction["keyboardInputCount"] != 4
            or interaction["buttonActivationCount"] != 6
            or interaction["ignoredInputCount"] != 0
            or interaction["beamMutationCount"] < 15
            or interaction["targetNavigationCount"] != 7
            or interaction["resetActionCount"] != 1
            or interaction["revealCount"] < 5
            or interaction["maximumDiscoveredTargetCount"] != 4
            or interaction["discoveredTargetCount"] != 1
            or interaction["activeTargetIndex"] != 0
            or interaction["navigationTargetIndex"] != 0
            or interaction["maximumBeamDeltaFromInitial"] < 1
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["lastInputKind"] != "button-next"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 274991
            or interaction["assetSha256"] != "a6179b9be47d700e55f452f44ce82b285b692d7d0a99e8521a78434e4fdb9329"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["sampledWidth"] != 96
            or interaction["sampledHeight"] != 54
            or interaction["sampledPixelCount"] != 5184
            or interaction["sampledByteLength"] != 20736
            or len(interaction["sourcePixelSha256"]) != 64
            or not interaction["sourcePixelShaMatchesExpected"]
            or interaction["distinctSampleColorCount"] <= 1200
            or interaction["warmMaskPixelCount"] < 70
            or interaction["warmMaskPixelCount"] > 180
            or interaction["rawWarmComponentCount"] < 4
            or interaction["filteredWarmComponentCount"] != 4
            or interaction["targetCount"] != 4
            or len(interaction["targetPixelCounts"]) != 4
            or any(count < 8 for count in interaction["targetPixelCounts"])
            or interaction["targetCoordinateChecksum"] <= 0
            or not interaction["targetCoordinateChecksumMatchesExpected"]
            or len(interaction["targetEvidence"]) != 4
            or any(target["pixelCount"] < 8 or not .08 < target["u"] < .92 or not .08 < target["v"] < .92 for target in interaction["targetEvidence"])
            or not interaction["assetEvidenceReady"]
            or not interaction["pixelEvidenceReady"]
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["p5CompletedDrawCount"] < 20
            or interaction["renderCount"] < 36
            or interaction["previewClockIgnoredCount"] < 36
            or interaction["previewClockMutationCount"] != 0
            or interaction["initialVisualStateChecksum"] == interaction["currentVisualStateChecksum"]
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted human beam aiming, all four pixel-clustered Storm Port anomalies, keyboard navigation, explicit reset, and retained post-reset evidence without an automatic sweep: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "spring-loaded-split-flap-counter":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        categories = interaction["categoryCounts"]
        if (
            not assertion
            or interaction["task"] != "human-operated-fictional-harbor-hall-seat-release-sync"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["renderer"] != "dom"
            or interaction["mechanism"] != "trusted-human-input-drives-paused-motion-split-flaps"
            or interaction["assetMechanismRole"] != "browser-decoded-source-pixels-determine-verified-seat-ceiling-zone-status-and-flap-material"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "visible-buttons", "visible-range"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["inputCount"] < 18
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 2
            or interaction["hoverMoveCount"] < 2
            or interaction["zoneInspectionCount"] < 2
            or interaction["zoneInspectionMutationCount"] < 2
            or not {"amber", "mint"}.issubset(set(interaction["distinctInspectedCategories"]))
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 8
            or interaction["pointerUpCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or "mouse" not in interaction["pointerTypesSeen"]
            or interaction["keyboardInputCount"] != 4
            or interaction["buttonActivationCount"] != 3
            or interaction["rangeMutationCount"] < 8
            or interaction["keyboardMutationCount"] != 3
            or interaction["buttonMutationCount"] != 2
            or interaction["planMutationCount"] != interaction["rangeMutationCount"] + interaction["keyboardMutationCount"] + interaction["buttonMutationCount"]
            or interaction["planMutationCount"] < 13
            or interaction["resetCount"] != 1
            or interaction["commitCount"] != 1
            or interaction["counterTransitionCount"] != interaction["planMutationCount"]
            or interaction["counterTransitionCount"] < 13
            or interaction["completedCounterTransitionCount"] < 1
            or interaction["interruptedCounterTransitionCount"] < 1
            or interaction["motionControllerCreateCount"] != interaction["counterTransitionCount"] * 8
            or interaction["motionControllerPlayCount"] != interaction["motionControllerCreateCount"]
            or interaction["activeMotionControllerCount"] != 0
            or interaction["maximumActiveMotionControllerCount"] != 8
            or not interaction["controlsBuiltWithoutAutoplay"]
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["lastPointerType"] != "mouse"
            or interaction["lastInputKind"] != "mouse-hover"
            or interaction["lastInputTrusted"] is not True
            or interaction["firstHumanValueBefore"] != interaction["verifiedSeatCeiling"]
            or interaction["firstHumanValueAfter"] >= interaction["verifiedSeatCeiling"]
            or interaction["minimumPlannedSeats"] != 0
            or interaction["maximumPlannedSeats"] != interaction["verifiedSeatCeiling"]
            or interaction["maximumHumanDelta"] < interaction["verifiedSeatCeiling"]
            or interaction["plannedSeats"] != interaction["verifiedSeatCeiling"]
            or interaction["committedSeats"] != interaction["verifiedSeatCeiling"]
            or interaction["verifiedSeatCeiling"] < 80
            or interaction["verifiedSeatCeiling"] > 9990
            or interaction["selectedCategory"] != "mint"
            or interaction["flapMaterialSource"] != "mint"
            or not interaction["flapMaterialColor"]
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or "image/jpeg" not in interaction["assetMimeType"]
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 376201
            or interaction["assetSha256"] != "3d9b707b5729214ce8283a62ee67fea4ea536f95f03ca3a44d3a52cc4dbd1edf"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or interaction["sampledWidth"] != 96
            or interaction["sampledHeight"] != 64
            or interaction["sampledPixelCount"] != 6144
            or interaction["sampledPixelByteLength"] != 24576
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or len(interaction["sampledPixelChecksum"]) != 8
            or interaction["distinctSampleColorCount"] <= 90
            or interaction["sampledLumaRange"] <= 60
            or categories["teal"] <= 200
            or categories["mint"] <= 25
            or categories["amber"] <= 120
            or categories["coral"] <= 200
            or interaction["classifiedPixelCount"] <= 900
            or sum(categories.values()) != 6144
            or not interaction["initialStillVerified"]
            or interaction["stageWidth"] != 320
            or interaction["stageHeight"] != 180
            or interaction["counterCoverageRatio"] <= 0
            or interaction["proofCoverageRatio"] <= 0
            or interaction["previewRenderCount"] < 36
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted proof hover, captured release-range draft, finite four-digit Motion transitions, explicit sync, reversible keyboard plan, and exact proof restore over the pixel-derived Harbor Hall seat ceiling: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "caustic-light-card-surface":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-pixel-derived-aquatic-material-optical-inspection"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "committed-photo-pixels-drive-human-positioned-refraction-caustic-geometry-and-material-readout"
            or interaction["assetMechanismRole"] != "every-sampled-pixel-binds-local-luminance-gradient-material-class-refraction-index-and-caustic-gain"
            or interaction["acceptedInputs"] != ["mouse-hover", "mouse-drag", "touch-drag", "pen-drag", "keyboard", "button-control", "range-control"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["nonInputVisualMutationCountAfterReady"] != 0
            or interaction["inputCount"] < 22
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 10
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["hoverMutationCount"] < 3
            or interaction["dragMutationCount"] < 10
            or interaction["keyboardInputCount"] != 4
            or interaction["keyboardMutationCount"] != 4
            or interaction["buttonActivationCount"] != 3
            or interaction["buttonMutationCount"] != 3
            or interaction["rangeInputCount"] < 3
            or interaction["rangeMutationCount"] != interaction["rangeInputCount"]
            or interaction["resetActionCount"] != 1
            or interaction["humanVisualMutationCount"] < 20
            or interaction["humanInputCausalityCount"] != interaction["humanVisualMutationCount"]
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["lastPointerType"] != "mouse"
            or interaction["lastInputTrusted"] is not True
            or interaction["maximumProbeTravel"] < .35
            or interaction["minimumHumanDepth"] > .22
            or interaction["maximumHumanDepth"] < .72
            or interaction["sourceSampleReadCount"] < 20
            or interaction["distinctMaterialVisitedCount"] < 4
            or len(interaction["visitedMaterialIds"]) < 4
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or "image/jpeg" not in interaction["assetMimeType"]
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 277104
            or interaction["assetSha256"] != "72850e8dad0c1c0f34b2f2b3eafef430c24cbe5bddc5aa88434a0e2371ed967c"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["sampleWidth"] != 96
            or interaction["sampleHeight"] != 54
            or interaction["sampledPixelCount"] != 5184
            or interaction["sampledByteLength"] != 20736
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["opaquePixelCount"] != 5184
            or interaction["distinctQuantizedColorCount"] <= 450
            or interaction["lumaRange"] <= .42
            or interaction["roughnessRange"] <= .2
            or interaction["responseRange"] <= .2
            or len(interaction["materialCategoryCounts"]) != 6
            or sum(interaction["materialCategoryCounts"]) != 5184
            or interaction["nonEmptyMaterialCategoryCount"] < 5
            or interaction["materialBindingChecksum"] <= 0
            or not interaction["assetEvidenceReady"]
            or not interaction["materialEvidenceReady"]
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["stageWidth"] != 320
            or interaction["stageHeight"] != 180
            or interaction["stageCoverageRatio"] <= .99
            or interaction["canvasCoverageRatio"] <= .99
            or interaction["p5CompletedDrawCount"] < 20
            or interaction["causticBandCount"] < 12
            or interaction["causticVertexCount"] <= 600
            or interaction["refractionSampleCount"] < 20
            or interaction["lastRenderedBindingChecksum"] != interaction["materialBindingChecksum"]
            or interaction["renderCount"] < 36
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted hover, captured multi-material lens dragging, keyboard/range depth control, visible shallower/deeper/reset actions, and robust pixel-derived optical evidence without automatic drift: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "cursor-drawn-constellation-thread":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        route = interaction["routeEvidence"]
        if (
            not assertion
            or interaction["task"] != "human-operated-night-navigation-observation-plate-calibration"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "same-origin-generated-observation-plate-pixels-determine-connectable-stars-confidence-and-route-validity"
            or interaction["acceptedInputs"] != ["mouse-hover", "mouse-drag", "touch-drag", "pen-drag", "keyboard", "button-control"]
            or not interaction["userInputRequired"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStaticConfirmed"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["inputCount"] < 22
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["ignoredInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerMoveCount"] < 16
            or interaction["pointerDownCount"] != 1
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerReleaseCaptureCount"] != 1
            or interaction["hoverMutationCount"] < 3
            or interaction["dragMutationCount"] < 15
            or interaction["keyboardInputCount"] != 1
            or interaction["buttonActivationCount"] != 3
            or interaction["fixAcceptanceCount"] != 7
            or interaction["undoCount"] != 1
            or interaction["resetCount"] != 0
            or interaction["confirmationCount"] != 2
            or interaction["confirmationClearCount"] != 1
            or interaction["routeMutationCount"] != 10
            or interaction["connectedFixCount"] != 6
            or interaction["maximumConnectedFixCount"] != 6
            or not interaction["routeComplete"]
            or not interaction["confirmed"]
            or interaction["connectedRouteIndices"] != [0, 1, 2, 3, 4, 5]
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["dragging"]
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 178986
            or interaction["assetSha256"] != "f4b2f9f14bb24fca891ca88dbc385f06d2f803516095956f6d7afb58bd596e2d"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["sampledWidth"] != 160
            or interaction["sampledHeight"] != 90
            or interaction["sampledPixelCount"] != 14400
            or interaction["sampledByteLength"] != 57600
            or len(interaction["sourcePixelSha256"]) != 64
            or not interaction["sourcePixelSha256"].strip("0")
            or interaction["distinctSampleColorCount"] <= 100
            or interaction["distinctSampleColorCount"] >= 5000
            or interaction["localMaximumCount"] < 18
            or interaction["candidateCount"] != 18
            or interaction["routeTargetCount"] != 6
            or interaction["minimumCandidateConfidence"] != 68
            or interaction["maximumCandidateConfidence"] != 99
            or interaction["candidateCoordinateChecksum"] <= 0
            or interaction["routeCoordinateChecksum"] <= 0
            or len(interaction["candidateEvidence"]) != 18
            or len(route) != 6
            or any(target["confidence"] < 68 or target["confidence"] > 99 for target in route)
            or any(route[index]["u"] <= route[index - 1]["u"] for index in range(1, len(route)))
            or not interaction["assetEvidenceReady"]
            or not interaction["pixelEvidenceReady"]
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["p5CompletedDrawCount"] < 10
            or interaction["renderCount"] < 36
            or interaction["previewClockIgnoredCount"] < 36
            or interaction["initialVisualStateChecksum"] == interaction["currentVisualStateChecksum"]
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted six-fix pixel-derived night route, explicit confirmation, undo, keyboard reacquisition, and final reseal without automatic stitching: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "accordion-depth-tunnel-navigation":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-underground-facility-depth-clearance-and-evidence-routing"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "motion-paused-css3d-accordion-seek-from-trusted-input-with-browser-decoded-image-evidence"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "range", "button", "keyboard"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["automaticPath"]
            or interaction["automaticPlayback"]
            or interaction["automaticTimeline"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["visualMutationFromPreviewClock"]
            or not interaction["renderIgnoresPreviewClock"]
            or not interaction["controlsBuiltWithoutAutoplay"]
            or interaction["nonInputProgressMutationCount"] != 0
            or interaction["inputCount"] != interaction["trustedInputCount"]
            or interaction["inputCount"] < 18
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["hoverInputCount"] < 2
            or interaction["pointerInputCount"] < 8
            or interaction["pointerDownCount"] != 1
            or interaction["pointerDragCount"] < 6
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerCaptured"]
            or interaction["dragActive"]
            or interaction["activePointerId"] is not None
            or interaction["mouseInputCount"] < 10
            or interaction["touchInputCount"] != 0
            or interaction["penInputCount"] != 0
            or interaction["rangeInputCount"] != 1
            or interaction["buttonInputCount"] != 3
            or interaction["keyboardInputCount"] != 4
            or interaction["targetSelectionCount"] != 3
            or interaction["resetCount"] != 1
            or interaction["humanProgressMutationCount"] < 14
            or interaction["minimumHumanProgress"] != 0
            or interaction["maximumHumanProgress"] != 4
            or interaction["maximumHumanDelta"] < 3
            or interaction["progress"] != interaction["recommendedLevel"]
            or interaction["selectedLevel"] != interaction["recommendedLevel"]
            or interaction["selectedLevelId"] != interaction["recommendedLevelId"]
            or interaction["motionControlCount"] != 5
            or interaction["motionSeekCount"] < 70
            or interaction["motionDuration"] != 4
            or interaction["motionTimeSpread"] != 0
            or len(interaction["transitionRecords"]) < 14
            or any(record["trusted"] is not True for record in interaction["transitionRecords"])
            or interaction["lastInputKind"] != "button"
            or interaction["lastInputSource"] != "button-target"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or "image/jpeg" not in interaction["assetMimeType"]
            or interaction["assetByteLength"] != 311455
            or interaction["assetSha256"] != "a64e63a15681acf9651f7905b54775cf70ef0a0f2e1cbabcc93c43e3b3608169"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["assetDecoded"]
            or interaction["assetDecodeCount"] != 1
            or interaction["assetNaturalWidth"] != 960
            or interaction["assetNaturalHeight"] != 640
            or interaction["sampleWidth"] != 96
            or interaction["sampleHeight"] != 64
            or interaction["sampledPixelCount"] != 6144
            or interaction["sampledByteLength"] != 24576
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["sampledOpaquePixelCount"] != 6144
            or interaction["layerEvidenceCount"] != 5
            or len(interaction["layerEvidence"]) != 5
            or interaction["distinctLayerColorCount"] < 4
            or interaction["luminanceRange"] < 35
            or interaction["luminanceRange"] > 230
            or interaction["riskRange"] < 18
            or interaction["riskRange"] > 100
            or any(layer["pixelCount"] < 700 for layer in interaction["layerEvidence"])
            or any(channel < 0 or channel > 255 for layer in interaction["layerEvidence"] for channel in layer["rgb"])
            or any(layer["riskScore"] < 0 or layer["riskScore"] > 100 for layer in interaction["layerEvidence"])
            or not interaction["pixelEvidenceBoundToNavigation"]
            or interaction["panelsUsingCommittedAsset"] != 5
            or interaction["runtimeAssertCount"] < 1
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted reversible five-panel depth seeking, the pixel-derived target stratum, and synchronized paused Motion controls without automatic tunnel navigation: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "kinetic-rain-letterpress":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-pixel-evidenced-digital-letterpress-make-ready"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["renderer"] != "canvas2d"
            or interaction["mechanism"] != "trusted-human-input-drops-deterministic-type-slugs-into-p5-letterpress-impressions-on-browser-decoded-proof-stock"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "range-control", "ink-buttons", "visible-action-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticTimeline"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["visualMutationFromPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["inputCount"] < 18
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 4
            or interaction["pointerDragCount"] < 4
            or interaction["pointerUpCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerTypesSeen"] != ["mouse"]
            or interaction["keyboardInputCount"] != 1
            or interaction["rangeInputCount"] != 3
            or interaction["inkButtonInputCount"] != 1
            or interaction["actionButtonInputCount"] != 6
            or interaction["rainStepCount"] != 5
            or interaction["undoCount"] != 1
            or interaction["resetCount"] != 0
            or interaction["impressionCount"] != 8
            or interaction["maximumImpressionCount"] != 8
            or interaction["stampMutationCount"] < 8
            or interaction["proofState"] != "passed"
            or interaction["proofConclusion"] != "PASS / EVEN BITE"
            or interaction["selectedInkId"] != "rust"
            or interaction["pressure"] != 69
            or interaction["minimumPressure"] != 69
            or interaction["maximumPressure"] != 72
            or interaction["recommendedPressure"] != 68
            or interaction["maximumProgress"] != 1
            or interaction["maximumProgressDelta"] < .28
            or interaction["humanVisualMutationCount"] < 18
            or interaction["humanInputCausalityCount"] != interaction["humanVisualMutationCount"]
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["dragging"]
            or interaction["lastInputKind"] != "keyboard"
            or interaction["lastInputSource"] != "glyph-selection"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or interaction["assetMimeType"] != "image/jpeg"
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 274593
            or interaction["assetSha256"] != "f560758adc555f66ffd903f9cc16d4e89aa447760b14faedfd83d5737cdc1863"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or interaction["sourcePixelCount"] != 614400
            or not interaction["browserCanvasReadback"]
            or interaction["sampledWidth"] != 96
            or interaction["sampledHeight"] != 54
            or interaction["sampledPixelCount"] != 5184
            or interaction["sampledPixelByteLength"] != 20736
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["sampledOpaquePixelCount"] != 5184
            or interaction["distinctSampleColorCount"] < 240
            or interaction["sampledLuminanceRange"] < .68
            or interaction["sampledLuminanceStdDev"] < .18
            or interaction["sampledSaturationMean"] < .08
            or interaction["sampledEdgeMean"] < .015
            or interaction["paperProfile"]["pixelCount"] < 1200
            or interaction["paperLuminance"] < .6
            or interaction["paperTextureDeviation"] < .014
            or interaction["paperEdgeMean"] < .0035
            or interaction["paperAbsorbency"] < .25
            or interaction["paperAbsorbency"] > .86
            or interaction["inkProfileCount"] != 3
            or len(interaction["inkProfiles"]) != 3
            or any(profile["pixelCount"] < 60 for profile in interaction["inkProfiles"])
            or interaction["minimumInkColorDistance"] < 18
            or not interaction["pixelEvidenceBoundToInk"]
            or not interaction["pixelEvidenceBoundToPaper"]
            or not interaction["pixelEvidenceBoundToConclusion"]
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or not interaction["p5NoLoop"]
            or interaction["p5DrawCount"] < 18
            or interaction["p5CompletedDrawCount"] != interaction["p5DrawCount"]
            or interaction["p5EventRedrawCount"] < 18
            or interaction["p5SourceDrawCount"] != interaction["p5DrawCount"]
            or interaction["p5GlyphDrawCount"] != 8
            or interaction["p5ImpressionDrawCount"] != 8
            or interaction["canvasWidth"] != 320
            or interaction["canvasHeight"] != 180
            or interaction["stageCoverageRatio"] < .94
            or interaction["canvasCoverageRatio"] < .98
            or interaction["previewClockIgnoredCount"] < 36
            or interaction["initialVisualStateChecksum"] == interaction["currentVisualStateChecksum"]
            or interaction["runtimeAssertCount"] < 2
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted cotton-stock hover, captured slug drop, source-sampled rust ink, pixel-derived pressure tuning, finite PROOFING steps, undo, and a final p5 noLoop PASS without automatic rain: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "polar-waveform-sundial":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-acoustic-daylight-recording-window-finder"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "same-origin-raster-polar-ring-pixels-drive-p5-waveform-frequency-energy-gnomon-and-recording-conclusion"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "range-control", "visible-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["nonInputVisualMutationCountAfterReady"] != 0
            or interaction["inputCount"] < 17
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 10
            or interaction["hoverMoveCount"] < 1
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerTypesSeen"] != ["mouse"]
            or interaction["keyboardInputCount"] != 2
            or interaction["rangeInputCount"] != 2
            or interaction["buttonActivationCount"] != 4
            or interaction["phaseMutationCount"] < 8
            or interaction["probeMutationCount"] < 8
            or interaction["bandMutationCount"] != 2
            or interaction["waveformMutationCount"] != 2
            or interaction["quietestActivationCount"] != 2
            or interaction["markMutationCount"] != 2
            or interaction["resetCount"] != 1
            or interaction["reversibleMutationCount"] < 12
            or interaction["humanMutationCount"] < 15
            or not interaction["marked"]
            or interaction["markedPhase"] != interaction["selectedPhase"]
            or abs(interaction["selectedPhase"] - interaction["quietestPhase"]) > .0001
            or interaction["selectedBandHz"] != 1200
            or interaction["selectedEnergy"] <= 0
            or not interaction["selectedTime"]
            or not interaction["selectedResponseLabel"]
            or not interaction["selectedConclusion"]
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["dragging"]
            or interaction["lastInputKind"] != "keyboard"
            or interaction["lastInputSource"] != "keyboard-m"
            or interaction["lastInputTrusted"] is not True
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetMimeType"].startswith("image/jpeg")
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 314778
            or interaction["assetSha256"] != "6000df299e322ee164dbb2b5695a750ed4fdb2e37718e84d529e783697d5eef8"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or interaction["sourcePixelCount"] != 614400
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["sampledWidth"] != 120
            or interaction["sampledHeight"] != 80
            or interaction["sampledPixelCount"] != 9600
            or interaction["sampledPixelByteLength"] != 38400
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["sampledPixelChecksum"] <= 0
            or interaction["distinctSampleColorCount"] <= 100
            or interaction["nonzeroSampleByteCount"] <= 19200
            or interaction["sourceAlphaFailureCount"] != 0
            or interaction["sampledLuminanceRange"] <= .5
            or interaction["sampledWarmSignalRange"] <= .6
            or interaction["sampledTealSignalMaximum"] <= .1
            or interaction["polarBinCount"] != 256
            or interaction["waveformPointCount"] != 256
            or interaction["waveformChecksum"] <= 0
            or interaction["initialWaveformChecksum"] <= 0
            or interaction["polarPixelEvaluationCount"] < 768
            or interaction["spectralPixelEvaluationCount"] != 2304
            or interaction["energyRange"] <= .4
            or interaction["quietestEnergy"] <= 0
            or interaction["meanEnergy"] <= interaction["quietestEnergy"]
            or interaction["loudestEnergy"] <= interaction["meanEnergy"]
            or interaction["dominantSourceBand"] not in ("LOW", "MID", "HIGH")
            or not interaction["rasterDrivenEvidenceReady"]
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["p5CompletedDrawCount"] < 15
            or interaction["p5ImageDrawCount"] < 1
            or interaction["guideRingDrawCount"] < 4
            or interaction["waveformSegmentDrawCount"] < 256
            or interaction["gnomonDrawCount"] < 1
            or interaction["renderedSampleCount"] <= 1000
            or interaction["renderedPixelChecksum"] <= 0
            or interaction["renderedLuminanceRange"] <= 40
            or interaction["previewRenderCalls"] < 36
            or interaction["initialVisualStateChecksum"] == interaction["currentVisualStateChecksum"]
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted response-plate hover, captured phase drag, keyboard/range changes, quiet-window finding, reset, and a final marked pixel-derived acoustic window without automatic rotation: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "seeded-sandpile-avalanche":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-fictional-slope-load-and-avalanche-inspection"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "decoded-raster-pixels-seed-material-stability-and-abelian-sandpile-load"
            or interaction["acceptedInputs"] != ["mouse-hover", "mouse-drag", "touch-drag", "pen-drag", "keyboard", "button", "range"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["nonInputVisualMutationCountAfterReady"] != 0
            or interaction["inputCount"] != interaction["trustedInputCount"]
            or interaction["inputCount"] < 20
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["hoverProbeCount"] < 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerDragCount"] < 8
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["depositMutationCount"] < 10
            or interaction["stepMutationCount"] != 2
            or interaction["probeMutationCount"] < 1
            or interaction["packetMutationCount"] != 1
            or interaction["undoCount"] != 2
            or interaction["resetCount"] != 1
            or interaction["buttonInputCount"] != 4
            or interaction["keyboardInputCount"] != 3
            or interaction["rangeInputCount"] != 1
            or interaction["mouseInputCount"] < 10
            or interaction["touchInputCount"] != 0
            or interaction["penInputCount"] != 0
            or interaction["humanMutationCount"] < 18
            or interaction["packetSize"] != interaction["initialPacketSize"]
            or interaction["appliedGrainCount"] <= 0
            or interaction["totalToppleCount"] <= 0
            or interaction["toppleWaveCount"] != 2
            or interaction["loadedCellCount"] <= 0
            or interaction["maximumCellLoad"] <= 3
            or interaction["undoDepth"] != 2
            or interaction["lastInputKind"] != "keyboard"
            or interaction["lastInputSource"] != "keyboard-enter"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or len(interaction["transitionRecords"]) < 15
            or any(record["trusted"] is not True for record in interaction["transitionRecords"])
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or "image/jpeg" not in interaction["assetMimeType"]
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 383665
            or interaction["assetSha256"] != "9f43f0bc952f91ef389e3cfa6ec75bc9ccd32ed8bb9038c122420b3c8980c02d"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["gridColumns"] != 60
            or interaction["gridRows"] != 36
            or interaction["sampledPixelCount"] != 2160
            or interaction["sampledPixelByteLength"] != 8640
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["sampledPixelChecksum"] <= 0
            or interaction["distinctSampleColorCount"] <= 220
            or interaction["sampledLuminanceRange"] <= .48
            or interaction["materialClassCount"] != 5
            or len(interaction["materialCellCounts"]) != 5
            or any(count <= 8 for count in interaction["materialCellCounts"])
            or sum(interaction["materialCellCounts"]) != 2160
            or interaction["terrainRiskRange"] <= .68
            or interaction["terrainRiskChecksum"] <= 0
            or interaction["seedCellCount"] != 2160
            or interaction["seedGrainCount"] <= 2160
            or interaction["seedGrainCount"] >= 6480
            or interaction["seedChecksum"] <= 0
            or not interaction["rasterDrivenEvidenceReady"]
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["p5ImageDrawCount"] < 1
            or interaction["materialCellDrawCount"] != 2160
            or interaction["loadedCellDrawCount"] <= 0
            or interaction["p5CompletedDrawCount"] < 15
            or interaction["initialCanvasSignature"] == 0
            or interaction["currentCanvasSignature"] == 0
            or interaction["initialCanvasSignature"] == interaction["currentCanvasSignature"]
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted terrain probing, a captured load path, finite Abelian waves, undo/reset, and a final retained pixel-seeded slope load without automatic toppling: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "signed-distance-neon-metropolis":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-night-city-right-of-way-clearance-inspection"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["renderer"] != "canvas2d"
            or interaction["mechanism"] != "committed-image-pixels-form-building-occupancy-mask-and-signed-distance-field-queried-by-trusted-human-input"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "native-range", "visible-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStaticConfirmed"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticOrbit"]
            or interaction["automaticTimeline"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["nonInputFieldMutationCount"] != 0
            or interaction["inputCount"] < 13
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 8
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["hoverMutationCount"] < 1
            or interaction["dragMutationCount"] < 6
            or interaction["keyboardInputCount"] != 1
            or interaction["keyboardMutationCount"] != 1
            or interaction["rangeInputCount"] != 2
            or interaction["rangeMutationCount"] != 2
            or interaction["buttonActivationCount"] != 1
            or interaction["buttonMutationCount"] != 1
            or interaction["pinToggleCount"] != 1
            or interaction["pinCount"] != 1
            or not interaction["pinned"]
            or interaction["resetCount"] != 0
            or interaction["requiredBufferMetres"] != 8
            or interaction["maximumHumanBufferMetres"] != 8
            or interaction["minimumHumanSignedDistanceMetres"] >= 0
            or interaction["maximumHumanSignedDistanceMetres"] <= 0
            or interaction["maximumProbeTravel"] <= .05
            or interaction["humanVisualMutationCount"] < 10
            or interaction["humanInputCausalityCount"] != interaction["humanVisualMutationCount"]
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["dragging"]
            or interaction["lastInputKind"] != "visible-button"
            or interaction["lastInputSource"] != "pin"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetMimeType"].startswith("image/jpeg")
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 345787
            or interaction["assetSha256"] != "8b46933f1b6da5075914f317d723fc3f27c38b853035de6e892004b1c9700263"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["assetByteLengthMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or interaction["sourcePixelCount"] != 614400
            or not interaction["browserCanvasReadback"]
            or interaction["sampledWidth"] != 128
            or interaction["sampledHeight"] != 72
            or interaction["sampledPixelCount"] != 9216
            or interaction["sampledPixelByteLength"] != 36864
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["nonzeroSampleByteCount"] <= 27648
            or interaction["opaqueSamplePixelCount"] != 9216
            or interaction["distinctQuantizedColorCount"] < 400
            or interaction["minimumSampleLuma"] >= 20
            or interaction["maximumSampleLuma"] <= 210
            or interaction["sampleLumaMean"] <= 65
            or interaction["sampleLumaMean"] >= 115
            or interaction["sampleLumaStdDev"] <= 55
            or interaction["sampleLumaStdDev"] >= 95
            or interaction["occupiedCellCount"] + interaction["streetCellCount"] != 9216
            or interaction["occupiedCellRatio"] < .25
            or interaction["occupiedCellRatio"] > .58
            or interaction["connectedBuildingMassCount"] < 12
            or interaction["connectedBuildingMassCount"] > 35
            or interaction["boundaryCellCount"] < 1200
            or interaction["boundaryCellCount"] > 4200
            or interaction["signedDistanceCellCount"] != 9216
            or interaction["minimumSignedDistanceMetres"] > -6
            or interaction["maximumSignedDistanceMetres"] < 7
            or interaction["positiveStreetDistanceCellCount"] <= 3200
            or interaction["negativeBuildingDistanceCellCount"] <= 1800
            or interaction["clearanceContourCellCount"] <= 1000
            or interaction["fieldChecksum"] <= 0
            or not interaction["pixelEvidenceReady"]
            or not interaction["pixelEvidenceBoundToField"]
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["p5CompletedDrawCount"] < 10
            or interaction["renderCount"] < 36
            or interaction["previewClockIgnoredCount"] < 36
            or interaction["stageCoverageRatio"] <= .98
            or interaction["canvasCoverageRatio"] <= .98
            or interaction["initialVisualChecksum"] == interaction["currentVisualChecksum"]
            or interaction["runtimeAssertCount"] < 2
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted full-stage night-city hover, captured clearance drag, signed positive/negative pixel distance, 8 m buffer adjustment, keyboard nudge, and a pinned finding without automatic skyline motion: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "flowfield-paper-marbling":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        category_total = sum(interaction["pigmentCategoryCounts"].values())
        if (
            not assertion
            or interaction["task"] != "human-operated-fictional-pigment-bath-calibration-combing-and-print-proof-approval"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "real-raster-pixels-to-pigment-density-local-gradient-flowfield-contamination-metrics-and-human-comb-deformation"
            or interaction["acceptedInputs"] != ["mouse-hover", "mouse-drag", "touch-drag", "pen-drag", "keyboard", "button", "range"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["nonInputVisualMutationCountAfterReady"] != 0
            or interaction["inputCount"] != interaction["trustedInputCount"]
            or interaction["inputCount"] < 20
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["hoverMoveCount"] < 1
            or interaction["pointerDownCount"] != 2
            or interaction["pointerMoveCount"] < 10
            or interaction["pointerUpCount"] != 2
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 2
            or interaction["pointerCaptureReleaseCount"] != 2
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or interaction["combStrokeCount"] != 2
            or interaction["combPointCount"] < 10
            or interaction["retainedStrokeCount"] != 1
            or interaction["retainedPointCount"] < 5
            or interaction["combMutationCount"] < 12
            or interaction["flowDeformationCount"] < 1
            or interaction["maximumFlowDeformation"] <= 0
            or interaction["rangeInputCount"] != 1
            or interaction["keyboardInputCount"] != 2
            or interaction["buttonActivationCount"] != 3
            or interaction["tineMutationCount"] != 2
            or interaction["undoCount"] != 1
            or interaction["resetCount"] != 1
            or interaction["approvalCount"] != 2
            or interaction["holdCount"] != 0
            or interaction["approvalMutationCount"] != 2
            or interaction["reversibleMutationCount"] < 4
            or interaction["humanMutationCount"] < 18
            or not interaction["approved"]
            or interaction["combTineCount"] != 9
            or interaction["currentQualityScore"] < 86
            or interaction["currentQualityLabel"] != "PRESS READY"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastInputKind"] != "keyboard"
            or interaction["lastInputSource"] != "keyboard-approve"
            or interaction["lastPointerType"] != "mouse"
            or interaction["pointerTypesSeen"] != ["mouse"]
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or "image/jpeg" not in interaction["assetMimeType"]
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 423661
            or interaction["assetSha256"] != "f368a7e66e8e91c8118739f5bddb7979a55b4aa0397c6007882bc1b80d12be01"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] < 2457600
            or interaction["sampledWidth"] != 72
            or interaction["sampledHeight"] != 48
            or interaction["sampledPixelCount"] != 3456
            or interaction["sampledPixelByteLength"] != 13824
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or len(interaction["sampledPixelChecksum"]) != 8
            or interaction["distinctSampleColorCount"] <= 250
            or interaction["sourceAlphaFailureCount"] != 0
            or interaction["sampledLuminanceMinimum"] >= .24
            or interaction["sampledLuminanceMaximum"] <= .72
            or interaction["sampledLuminanceRange"] <= .55
            or interaction["pigmentDensity"] <= .2
            or interaction["pigmentDensity"] >= .88
            or interaction["pigmentDensityRange"] <= .55
            or interaction["contaminationPixelCount"] < 0
            or interaction["contaminationRatio"] < 0
            or interaction["contaminationRatio"] >= .18
            or category_total != 3456
            or not {"indigo", "oxidized-teal", "madder", "ochre"}.issubset(set(interaction["pigmentCategoriesPresent"]))
            or interaction["flowFieldWidth"] != 72
            or interaction["flowFieldHeight"] != 48
            or interaction["flowCellCount"] != 3456
            or len(interaction["flowVectorChecksum"]) != 8
            or interaction["flowMagnitudeMinimum"] <= 0
            or interaction["flowMagnitudeMaximum"] <= interaction["flowMagnitudeMinimum"]
            or interaction["flowMagnitudeRange"] <= .2
            or interaction["sourceQualityScore"] < 60
            or interaction["sourceQualityScore"] > 89
            or interaction["paperCoverageRatio"] <= .42
            or interaction["paperCoverageRatio"] >= .52
            or interaction["canvasCoverageRatio"] < .95
            or interaction["p5ImageDrawCount"] < 1
            or interaction["streamlineDrawCount"] < 50
            or interaction["streamlineSegmentDrawCount"] < 400
            or interaction["combGuideDrawCount"] < 7
            or interaction["p5CompletedDrawCount"] < 12
            or not interaction["initialStillVerified"]
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture two trusted retained marbling combs, reversible proof controls, and final explicit approval over a pixel-built pigment flowfield without automatic advection: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "kinetic-variable-font-axis":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-wayfinding-variable-font-fit-from-real-scene-pixels"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "decoded-image-luminance-and-edge-analysis-recommends-human-controlled-per-glyph-wght-wdth-axes"
            or interaction["acceptedInputs"] != ["captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "range-controls", "visible-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["initialFrameStatic"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["timerMutationCount"] != 0
            or interaction["inputCount"] < 12
            or interaction["humanInputCausalityCount"] < 10
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] != 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 6
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerReleaseCaptureCount"] != 1
            or interaction["dragMutationCount"] < 6
            or interaction["mouseDragMutationCount"] < 6
            or interaction["touchDragMutationCount"] != 0
            or interaction["penDragMutationCount"] != 0
            or interaction["dragDistance"] < .45
            or interaction["rangeInputCount"] != 2
            or interaction["keyboardInputCount"] != 1
            or interaction["buttonActivationCount"] != 3
            or interaction["matchSceneCount"] != 2
            or interaction["resetCount"] != 1
            or interaction["axisMutationCount"] < 10
            or interaction["currentWidth"] != interaction["recommendedWidth"]
            or interaction["currentWeight"] != interaction["recommendedWeight"]
            or interaction["proofScore"] != 100
            or interaction["bestProofScore"] != 100
            or interaction["currentAxisChecksum"] == interaction["initialAxisChecksum"]
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["lastInputTrusted"] is not True
            or interaction["lastInputKind"] != "keyboard-Enter"
            or interaction["lastPointerType"] != "mouse"
            or interaction["sourceFetchCount"] != 1
            or interaction["sourceResponseStatus"] != 200
            or not interaction["sourceSameOrigin"]
            or interaction["sourceByteLength"] != 195640
            or interaction["sourceSha256"] != "8f153c760da05ffdc5b00fc8c27790ab45d30186a4680565efa3fad4fbd096d0"
            or not interaction["sourceShaMatchesExpected"]
            or not interaction["imageDecoded"]
            or interaction["imageNaturalWidth"] != 960
            or interaction["imageNaturalHeight"] != 640
            or interaction["sourcePixelCount"] != 614400
            or interaction["analysisWidth"] != 96
            or interaction["analysisHeight"] != 64
            or interaction["analysisPixelCount"] != 6144
            or interaction["analysisByteLength"] != 24576
            or len(interaction["analysisSha256"]) != 64
            or not interaction["analysisSha256"].strip("0")
            or interaction["analysisChecksum"] == 0
            or interaction["distinctColorCount"] <= 300
            or interaction["lumaDeviation"] <= 25
            or interaction["darkPixelRatio"] <= .1
            or interaction["darkPixelRatio"] >= .8
            or interaction["brightPixelRatio"] <= .02
            or interaction["brightPixelRatio"] >= .3
            or interaction["edgeDensity"] <= .05
            or interaction["edgeDensity"] >= .2
            or interaction["edgeSampleCount"] != 12128
            or interaction["recommendationChecksum"] == 0
            or interaction["recommendedWidth"] < 72
            or interaction["recommendedWidth"] > 102
            or interaction["recommendedWeight"] < 560
            or interaction["recommendedWeight"] > 860
            or interaction["glyphCount"] != 10
            or interaction["glyphVariationCount"] != 10
            or interaction["glyphTransformCount"] != 10
            or interaction["motionAnimationCount"] < 80
            or interaction["motionAnimationSettledCount"] < 10
            or interaction["activeMotionCount"] != 0
            or interaction["renderCount"] < 36
            or interaction["runtimeAssertCount"] < 2
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted wayfinding-type drag, native axis controls, reset, and an explicit pixel-derived 100% scene match with ten settled Motion glyphs and no automatic axis playback: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "gravity-well-icon-field":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-deep-field-gravitational-lens-candidate-inspection"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "same-origin-image-pixels-drive-p5-gravity-lens-magnification-local-evidence-and-candidate-conclusion"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "visible-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStaticConfirmed"]
            or not interaction["animationSettled"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["inputCount"] < 15
            or interaction["humanInputCausalityCount"] < 12
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["ignoredInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 5
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerReleaseCaptureCount"] != 1
            or interaction["hoverMutationCount"] < 1
            or interaction["dragMutationCount"] < 4
            or interaction["dragDistance"] < .4
            or interaction["keyboardInputCount"] != 3
            or interaction["buttonActivationCount"] != 5
            or interaction["massAdjustmentCount"] != 3
            or interaction["lockCount"] != 3
            or interaction["resetCount"] != 1
            or interaction["maximumLensMass"] < 1.55
            or not interaction["locked"]
            or interaction["lockedCandidateIndex"] != 0
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["dragging"]
            or interaction["lastInputTrusted"] is not True
            or interaction["lastInputKind"] != "button-lock"
            or interaction["lastPointerType"] != "mouse"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 192363
            or interaction["assetSha256"] != "aa5095130a0a1424c6d43d95229728fd06a703beda30c5cb93b501f5be0c7c6a"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["sampledWidth"] != 160
            or interaction["sampledHeight"] != 90
            or interaction["sampledPixelCount"] != 14400
            or interaction["sampledByteLength"] != 57600
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["distinctSampleColorCount"] <= 120
            or interaction["nonzeroSampleByteCount"] <= 14400
            or interaction["globalMeanLuma"] <= .02
            or interaction["globalEdgeMean"] <= .01
            or interaction["globalEdgeMaximum"] <= interaction["globalEdgeMean"]
            or interaction["candidateCount"] != 7
            or len(interaction["candidateEvidence"]) != 7
            or interaction["candidateCoordinateChecksum"] <= 0
            or interaction["minimumCandidateScore"] < 40
            or interaction["maximumCandidateScore"] < 60
            or not interaction["assetEvidenceReady"]
            or not interaction["pixelEvidenceReady"]
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["p5CompletedDrawCount"] < 10
            or interaction["renderCount"] < 36
            or interaction["previewClockIgnoredCount"] < 36
            or interaction["initialVisualStateChecksum"] == interaction["currentVisualStateChecksum"]
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted deep-field hover, captured lens drag, source-derived candidate lock, keyboard position/mass changes, reset, and a final candidate-01 lock without automatic orbits: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "magnetic-orbit-command-dock":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-pixel-aware-harbor-media-command-ranking-and-magnetic-orbit-dock"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["renderer"] != "dom"
            or interaction["mechanism"] != "same-origin-decoded-image-pixels-rank-five-commands-and-trusted-human-input-seeks-paused-motion-orbit-transforms"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "range-control", "visible-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticTimeline"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["visualMutationFromPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["inputCount"] < 15
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["hoverInputCount"] < 2
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 6
            or interaction["pointerDragCount"] < 4
            or interaction["pointerUpCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerTypesSeen"] != ["mouse"]
            or interaction["keyboardInputCount"] != 5
            or interaction["rangeInputCount"] != 2
            or interaction["buttonInputCount"] != 2
            or interaction["commandSelectionCount"] != 3
            or interaction["resetCount"] != 1
            or interaction["humanVisualMutationCount"] < 14
            or interaction["humanInputCausalityCount"] != interaction["humanVisualMutationCount"]
            or not interaction["hasHumanSample"]
            or interaction["selectedCommandId"] != interaction["recommendedCommandId"]
            or interaction["recommendedCommandId"] not in ("lift", "trace", "grade", "mask", "verify")
            or interaction["recommendedCommandScore"] <= 0
            or interaction["maximumPointerTravel"] <= .05
            or interaction["minimumPointerU"] >= interaction["maximumPointerU"]
            or interaction["minimumPointerV"] >= interaction["maximumPointerV"]
            or interaction["maximumPullStrength"] <= interaction["minimumPullStrength"]
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["dragging"]
            or interaction["lastInputKind"] != "keyboard"
            or interaction["lastInputSource"] != "queue-recommendation"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or interaction["assetMimeType"] != "image/jpeg"
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 257814
            or interaction["assetSha256"] != "6491e95d92172869c9dcacd2b1b3128cd23e4e050156aac3add581ed8cb105a6"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or interaction["sourcePixelCount"] != 614400
            or not interaction["browserCanvasReadback"]
            or interaction["sampledWidth"] != 96
            or interaction["sampledHeight"] != 54
            or interaction["sampledPixelCount"] != 5184
            or interaction["sampledPixelByteLength"] != 20736
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["sampledOpaquePixelCount"] != 5184
            or interaction["distinctSampleColorCount"] < 600
            or interaction["sampledLuminanceRange"] < .62
            or interaction["sampledLuminanceStdDev"] < .13
            or interaction["sampledSaturationMean"] < .12
            or interaction["sampledEdgeMean"] < .025
            or interaction["sampledWarmPixelRatio"] < .01
            or interaction["pixelProbeCount"] != 6
            or interaction["probeRecommendationDiversity"] < 3
            or len(interaction["probeRecommendations"]) != 6
            or not interaction["pixelEvidenceBoundToCommandRanking"]
            or not interaction["pixelEvidenceBoundToOrbitGeometry"]
            or interaction["localSamplePixelCount"] <= 0
            or not interaction["lastSampleChecksum"].strip("0")
            or interaction["motionInitialControlCount"] != 5
            or interaction["motionControlBuildCount"] < 10
            or interaction["motionSeekCount"] < 6
            or interaction["motionDrivenToolCount"] != 5
            or not interaction["motionControlsPaused"]
            or not interaction["motionControlsBuiltWithoutAutoplay"]
            or len(interaction["currentToolTransforms"]) != 5
            or interaction["stageCoverageRatio"] < .94
            or interaction["initialVisualStateChecksum"] == interaction["currentVisualStateChecksum"]
            or interaction["runtimeAssertCount"] < 2
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted harbor pixel sampling, five paused Motion command seeks, range/button/keyboard reversibility, and a final source-ranked queued command without automatic orbiting: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "stencil-text-scanline-window":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-pixel-derived-print-registration-gate"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["renderer"] != "dom"
            or interaction["mechanism"] != "human-seeks-a-paused-motion-control-synchronized-to-css-clipped-stencil-window-over-browser-decoded-proof-pixels"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "visible-range", "visible-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["nonInputVisualMutationCountAfterReady"] != 0
            or interaction["inputCount"] < 30
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["hoverMoveCount"] < 1
            or interaction["pointerDownCount"] != 2
            or interaction["pointerMoveCount"] < 20
            or interaction["pointerUpCount"] != 2
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 2
            or interaction["pointerCaptureReleaseCount"] != 2
            or interaction["pointerTypesSeen"] != ["mouse"]
            or interaction["keyboardInputCount"] != 4
            or interaction["keyboardMutationCount"] < 2
            or interaction["rangeInputCount"] != 1
            or interaction["rangeMutationCount"] != 1
            or interaction["buttonActivationCount"] != 3
            or interaction["buttonMutationCount"] < 2
            or interaction["humanVisualMutationCount"] < 25
            or interaction["humanInputCausalityCount"] != interaction["humanVisualMutationCount"]
            or interaction["maximumHumanTravel"] < .8
            or interaction["evaluationCount"] != 3
            or interaction["incompleteEvaluationCount"] != 2
            or interaction["holdEvaluationCount"] != 1
            or interaction["passEvaluationCount"] != 0
            or interaction["resetCount"] != 1
            or interaction["approvalState"] != "hold"
            or interaction["lastEvaluatedDisposition"] != "hold"
            or interaction["sourceDisposition"] != "hold"
            or interaction["inspectedTargetCount"] != 4
            or interaction["maximumInspectedTargetCount"] != 4
            or interaction["scanCoverageBinCount"] < 6
            or interaction["maximumScanCoverageBinCount"] < 10
            or interaction["scanMetricReadCount"] < 30
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["lastInputKind"] != "button-evaluate"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or not interaction["motionControlReady"]
            or interaction["motionDuration"] != 1
            or interaction["motionSyncError"] >= .0001
            or interaction["maximumMotionSyncError"] >= .0001
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or interaction["assetMimeType"] != "image/jpeg"
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 246388
            or interaction["assetSha256"] != "36471dadbf8888ddf16ae2b68156b39e587f3a4bb323f76f9b8456903c42a7e4"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or interaction["sampleWidth"] != 192
            or interaction["sampleHeight"] != 128
            or interaction["sampledPixelCount"] != 24576
            or interaction["sampledPixelByteLength"] != 98304
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or len(interaction["sampledPixelChecksum"]) != 8
            or interaction["distinctQuantizedColorCount"] <= 180
            or interaction["opaquePixelCount"] != 24576
            or interaction["lumaRange"] <= 175
            or sum(interaction["inkCategoryCounts"]) != 24576
            or interaction["nonEmptyInkCategoryCount"] < 6
            or any(count <= 35 for count in interaction["inkCategoryCounts"][1:6])
            or interaction["edgeRange"] <= .55
            or interaction["defectDetectionCandidateCount"] <= 4500
            or interaction["defectTargetCount"] != 4
            or len(interaction["defectTargets"]) != 4
            or any(target["severity"] <= .45 or target["rawScore"] <= 0 for target in interaction["defectTargets"])
            or interaction["defectSpatialSeparationMinimum"] < 28
            or interaction["globalDefectSeverity"] <= 60
            or not interaction["assetEvidenceReady"]
            or not interaction["pixelEvidenceReady"]
            or interaction["stageCoverageRatio"] <= .99
            or interaction["proofCoverageRatio"] <= .99
            or interaction["visualRenderCount"] < 25
            or interaction["previewRenderInvocationCount"] < 36
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted full-proof scan coverage, four pixel-derived registration targets, paused Motion/CSS synchronization, reset, incomplete review, and a final source-owned HOLD disposition without automatic scanning: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "cellular-automata-hover-bloom":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-image-sampled-green-roof-recovery-lab"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "p5-renders-human-stepped-cellular-life-constrained-by-same-origin-browser-sampled-roof-pixels"
            or interaction["acceptedInputs"] != ["mouse-hover", "mouse-drag", "touch-drag", "pen-drag", "keyboard", "button-control", "range-control"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockCallCount"] < 36
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["inputCount"] < 20
            or interaction["humanInputCausalityCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 2
            or interaction["pointerMoveCount"] < 12
            or interaction["pointerUpCount"] != 2
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 2
            or interaction["pointerCaptureReleaseCount"] != 2
            or interaction["dragMoveCount"] < 8
            or interaction["keyboardInputCount"] != 3
            or interaction["buttonActivationCount"] != 5
            or interaction["rangeInputCount"] != 2
            or interaction["hoverMutationCount"] < 5
            or interaction["paintMutationCount"] < 2
            or interaction["stepCount"] != 4
            or interaction["undoCount"] != 1
            or interaction["resetCount"] != 1
            or interaction["ruleMutationCount"] != 2
            or interaction["humanMutationCount"] < 10
            or interaction["maximumHistoryDepth"] < 4
            or interaction["visitedCellCount"] < 8
            or interaction["generation"] != 1
            or interaction["tolerance"] != 38
            or interaction["currentFieldChecksum"] == interaction["initialFieldChecksum"]
            or not interaction["fieldChangedByHuman"]
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["lastInputTrusted"] is not True
            or interaction["lastInputKind"] != "button-step"
            or interaction["lastPointerType"] != "mouse"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or interaction["assetMimeType"] != "image/jpeg"
            or interaction["assetByteLength"] != 461364
            or interaction["assetSha256"] != "1072ce13e2e5c01aa72879efce186a04c2db8bf1dacfdfbc117132d494620c78"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["browserCanvasReadback"]
            or interaction["sampledWidth"] != 96
            or interaction["sampledHeight"] != 54
            or interaction["sampledPixelCount"] != 5184
            or interaction["sampledPixelByteLength"] != 20736
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["distinctSampleColorCount"] <= 350
            or interaction["sampledLumaRange"] <= 130
            or interaction["cellCount"] != 1296
            or interaction["visibleCellCount"] != 1296
            or interaction["viableCellCount"] <= 220
            or interaction["viableCellCount"] >= 1000
            or interaction["heatCellCount"] <= 100
            or interaction["dampCellCount"] <= 20
            or interaction["laneCellCount"] <= 50
            or interaction["initialLiveCellCount"] < 6
            or interaction["initialLiveCellCount"] > 12
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["p5DrawCount"] < 10
            or interaction["completedDrawCount"] < 10
            or interaction["stageCoverageRatio"] < .98
            or interaction["canvasCoverageRatio"] < .98
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted pixel-probed roof seeding, finite manual generations, rule adjustment, undo/reset, and a retained final field without automatic evolution: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "elastic-voronoi-focus-mosaic":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-coastal-image-evidence-focus-and-classification"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "p5-image-pixels-drive-power-diagram-site-evidence-classification-and-elastic-focus-area"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "visible-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStaticConfirmed"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["inputCount"] < 20
            or interaction["humanInputCausalityCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 10
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerReleaseCaptureCount"] != 1
            or interaction["keyboardInputCount"] != 2
            or interaction["buttonActivationCount"] != 7
            or interaction["hoverFocusCount"] < 1
            or interaction["dragFocusCount"] < 3
            or interaction["lockCount"] < 4
            or interaction["resetCount"] != 1
            or interaction["dragDistance"] < .45
            or interaction["selectedIndex"] != 7
            or interaction["focusIndex"] != 7
            or interaction["maximumFocusExpansionRatio"] <= 1.18
            or interaction["focusExpansionRatio"] <= 1.18
            or not interaction["animationSettled"]
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["lastInputTrusted"] is not True
            or interaction["lastInputKind"] != "button-lock"
            or interaction["lastPointerType"] != "mouse"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 360838
            or interaction["assetSha256"] != "45a73a7734337e154e4bb3a28a2ee86833228661d2a4b385791fb2af798f2a9a"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["sampledPixelCount"] != 2925
            or interaction["sampledByteLength"] != 11700
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["distinctSampleColorCount"] <= 200
            or interaction["evidenceSiteCount"] != 13
            or interaction["evidenceClassCount"] < 3
            or interaction["evidenceClassCount"] > 5
            or len(interaction["evidenceClasses"]) != interaction["evidenceClassCount"]
            or interaction["evidenceChecksum"] <= 0
            or not interaction["evidenceReady"]
            or interaction["partitionCoverageCellCount"] != 3600
            or interaction["partitionExpectedCellCount"] != 3600
            or interaction["partitionRegionCount"] != 13
            or interaction["adjacencyEdgeCount"] < 16
            or interaction["minimumNeighborCount"] < 2
            or abs(interaction["currentPartitionArea"] - 57600) >= .05
            or interaction["currentGeometryChecksum"] <= 0
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CompletedDrawCount"] < 10
            or interaction["renderCount"] < 36
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted coastal-evidence hover, captured weighted-focus dragging, lock/reset/keyboard reversibility, and exact source-backed power-diagram topology without automatic focus: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "magnetic-pixel-sort-field":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-image-pixel-magnetic-media-recovery"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["renderer"] != "canvas2d"
            or interaction["mechanism"] != "same-origin-decoded-image-rgb-drives-p5-local-magnetic-pixel-sorting-axis-clusters-and-media-quality"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "range-control", "visible-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStaticConfirmed"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["runtimeAssertCount"] < 2
            or interaction["inputCount"] < 20
            or interaction["humanInputCausalityCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 2
            or interaction["pointerMoveCount"] < 12
            or interaction["pointerUpCount"] != 2
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 2
            or interaction["pointerCaptureReleaseCount"] != 2
            or interaction["hoverMutationCount"] < 2
            or interaction["dragMutationCount"] < 7
            or interaction["keyboardInputCount"] != 3
            or interaction["rangeInputCount"] != 2
            or interaction["buttonActivationCount"] != 4
            or interaction["commitCount"] != 3
            or interaction["undoCount"] != 1
            or interaction["restoreCount"] != 1
            or interaction["sortPassCount"] < 10
            or interaction["fieldMutationCount"] < 15
            or interaction["humanMutationCount"] < 20
            or interaction["fieldStrength"] != 22
            or interaction["minimumFieldStrength"] != 22
            or interaction["maximumFieldStrength"] != 24
            or interaction["activeSortFieldCount"] < 5
            or interaction["maximumSortFieldCount"] < interaction["activeSortFieldCount"]
            or interaction["magnetTravelDistance"] < .5
            or interaction["visitedFieldCount"] < 10
            or interaction["sortedPixelCount"] <= 500
            or interaction["sortedPixelRatio"] <= .03
            or interaction["dragging"]
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or not interaction["magnetVisible"]
            or interaction["lastInputKind"] != "button-commit"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 269655
            or interaction["assetSha256"] != "b8b8d852b997df2fca2fb6d0dda7b561c3eca97599d55c09195e6723062c5275"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or interaction["sourcePixelCount"] != 614400
            or interaction["sampledWidth"] != 160
            or interaction["sampledHeight"] != 90
            or interaction["sampledPixelCount"] != 14400
            or interaction["sampledPixelByteLength"] != 57600
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["distinctSampleColorCount"] <= 5000
            or interaction["distinctSampleColorCount"] >= 14400
            or interaction["nonzeroSampleByteCount"] <= 43200
            or interaction["sampledLumaMinimum"] < 0
            or interaction["sampledLumaMinimum"] >= 15
            or interaction["sampledLumaMaximum"] <= 180
            or interaction["sampledLumaMaximum"] > 255
            or interaction["sampledLumaMean"] <= 60
            or interaction["sampledLumaMean"] >= 110
            or interaction["sampledLumaStdDev"] <= 45
            or interaction["sampledLumaStdDev"] >= 75
            or interaction["sampledSaturationMean"] <= .35
            or interaction["sampledSaturationMean"] >= .7
            or interaction["chromaticPixelCount"] <= 7000
            or interaction["chromaticPixelCount"] >= 10000
            or interaction["chromaticPixelRatio"] <= .45
            or interaction["chromaticPixelRatio"] >= .72
            or interaction["horizontalEdgeSampleCount"] != 14310
            or interaction["verticalEdgeSampleCount"] != 14240
            or interaction["horizontalEdgeMean"] <= .02
            or interaction["horizontalEdgeMean"] >= .08
            or interaction["verticalEdgeMean"] <= .01
            or interaction["verticalEdgeMean"] >= .06
            or interaction["edgeEnergyMean"] <= .02
            or interaction["edgeEnergyMean"] >= .07
            or interaction["recommendedSortAxis"] != "vertical"
            or interaction["recommendedSortKey"] != "hue"
            or interaction["hueClusterCount"] != 5
            or len(interaction["hueClusterCenters"]) != 5
            or len(interaction["hueClusterPixelCounts"]) != 5
            or len(interaction["hueClusterColors"]) != 5
            or sum(interaction["hueClusterPixelCounts"]) != interaction["chromaticPixelCount"]
            or interaction["mediaQualityScore"] < 65
            or interaction["mediaQualityScore"] > 90
            or len(interaction["mediaQualityConclusion"]) <= 12
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["stageCoverageRatio"] <= .98
            or interaction["canvasCoverageRatio"] <= .98
            or interaction["p5CompletedDrawCount"] < 20
            or interaction["renderCount"] < 20
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted reversible source-pixel magnetic recovery, exact archive evidence, and a human-preserved final sort without automatic behavior: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "reaction-diffusion-growth-field":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-image-sampled-biomaterial-reaction-diffusion-assay"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["renderer"] != "canvas2d"
            or interaction["mechanism"] != "gray-scott-reaction-diffusion-with-per-cell-feed-kill-and-diffusion-parameters-derived-from-decoded-source-pixels"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "range-control", "visible-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["nonInputVisualMutationCountAfterReady"] != 0
            or interaction["inputCount"] < 20
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["hoverMoveCount"] < 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 10
            or interaction["dragMoveCount"] < 10
            or interaction["pointerUpCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerTypesSeen"] != ["mouse"]
            or interaction["keyboardInputCount"] != 3
            or interaction["rangeInputCount"] != 2
            or interaction["buttonActivationCount"] != 3
            or interaction["manualStepBatchCount"] != 4
            or interaction["stepButtonCount"] != 3
            or interaction["stepKeyboardCount"] != 1
            or interaction["generation"] != 32
            or interaction["solverIterationCount"] != 32
            or interaction["nutrientBias"] != 2
            or interaction["biasMutationCount"] != 2
            or interaction["inoculationStrokeCount"] != 2
            or interaction["inoculationPointCount"] < 10
            or interaction["depositedCellMutationCount"] <= 0
            or interaction["inoculatedCellCount"] <= 0
            or interaction["undoCount"] != 0
            or interaction["resetCount"] != 0
            or not interaction["fieldChangedByHuman"]
            or interaction["currentFieldChecksum"] == interaction["initialFieldChecksum"]
            or interaction["humanMutationCount"] <= 0
            or interaction["humanInputCausalityCount"] <= 0
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["lastInputKind"] != "button-step"
            or interaction["lastInputSource"] != "visible-button"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or not interaction["assetMimeType"].startswith("image/jpeg")
            or interaction["assetByteLength"] != 418008
            or interaction["assetSha256"] != "316ec17368475dafffaba704a2be2b5ecff9a436698f8947263f9e1f47e5f46a"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] < 2457600
            or not interaction["browserCanvasReadback"]
            or interaction["sampledWidth"] != 80
            or interaction["sampledHeight"] != 45
            or interaction["sampledPixelCount"] != 3600
            or interaction["sampledPixelByteLength"] != 14400
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or len(interaction["sampledPixelChecksum"]) != 8
            or interaction["distinctSampleColorCount"] <= 300
            or interaction["sourceAlphaFailureCount"] != 0
            or interaction["sampledLumaMinimum"] >= .25
            or interaction["sampledLumaMaximum"] <= .72
            or interaction["sampledLumaRange"] <= .55
            or interaction["sampledSaturationMean"] <= .18
            or interaction["sampledSaturationMean"] >= .72
            or interaction["edgePairSampleCount"] != 7075
            or interaction["edgeStrengthMaximum"] <= .18
            or interaction["edgeStrengthRange"] <= .16
            or len(interaction["zoneCategoriesPresent"]) < 5
            or interaction["zoneCategoryCounts"].get("cellulose", 0) <= 50
            or interaction["zoneCategoryCounts"].get("agar", 0) <= 50
            or interaction["zoneCategoryCounts"].get("mineral", 0) <= 50
            or interaction["zoneCategoryCounts"].get("biofilm", 0) <= 20
            or interaction["zoneCategoryCounts"].get("seam", 0) <= 10
            or interaction["feedRange"] <= .008
            or interaction["killRange"] <= .005
            or interaction["diffusionARange"] <= .1
            or interaction["diffusionBRange"] <= .08
            or interaction["initialSeedAnchorCount"] != 7
            or interaction["initialSeedCellCount"] < 75
            or interaction["initialSeedCellCount"] > 100
            or interaction["initialSeedEdgeMean"] <= .1
            or len(interaction["initialFieldChecksum"]) != 8
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["p5CompletedDrawCount"] < 15
            or interaction["p5ImageDrawCount"] < 1
            or interaction["substrateCellDrawCount"] != 3600
            or interaction["reactionCellDrawCount"] <= 0
            or interaction["stageCoverageRatio"] <= .98
            or interaction["canvasCoverageRatio"] <= .98
            or interaction["previewRenderCalls"] < 36
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted biomaterial probing, captured inoculation, pixel-derived nutrient bias, keyboard seeding, and four finite eight-iteration Gray-Scott batches without automatic growth: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "kinetic-typography-letter-springs":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-four-ink-kinetic-title-tension-proofing"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["renderer"] != "canvas2d"
            or interaction["mechanism"] != "committed-proof-pixels-determine-ink-palette-spring-constants-outline-and-print-decision-while-trusted-input-drives-finite-letter-level-spring-sequences"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "native-range", "visible-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStaticConfirmed"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticTimeline"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["automaticSequenceStartCount"] != 0
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["nonInputVisualMutationCount"] != 0
            or interaction["inputCount"] < 16
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 10
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["dragMutationCount"] < 5
            or interaction["keyboardInputCount"] != 2
            or interaction["keyboardMutationCount"] < 1
            or interaction["rangeInputCount"] != 2
            or interaction["rangeMutationCount"] != 2
            or interaction["buttonActivationCount"] != 3
            or interaction["releaseCount"] != 1
            or interaction["holdToggleCount"] != 2
            or interaction["resetCount"] != 0
            or interaction["pull"] != 9
            or not interaction["locked"]
            or interaction["finiteSequenceStartCount"] < 10
            or interaction["finiteSequenceCancellationCount"] < 1
            or interaction["maximumSequenceStepCount"] > 30
            or interaction["humanVisualMutationCount"] <= 0
            or interaction["humanInputCausalityCount"] <= 0
            or interaction["maximumHumanDisplacement"] <= 0
            or interaction["currentVisualChecksum"] == interaction["initialVisualChecksum"]
            or interaction["lastInputKind"] != "visible-button"
            or interaction["lastInputSource"] != "hold"
            or interaction["lastInputTrusted"] is not True
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or not interaction["assetMimeType"].startswith("image/jpeg")
            or interaction["assetByteLength"] != 316790
            or interaction["assetSha256"] != "19742a0f7aa7a5a91f50c9ea04f285bc34017195cbdd157b9971e5ce05e73af1"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["browserCanvasReadback"]
            or interaction["sampledWidth"] != 96
            or interaction["sampledHeight"] != 64
            or interaction["sampledPixelCount"] != 6144
            or interaction["sampledPixelByteLength"] != 24576
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["distinctQuantizedColorCount"] < 300
            or interaction["sampleLumaStdDev"] < 50
            or interaction["inkProfileCount"] != 4
            or interaction["inkEvidencePixelCount"] < 1500
            or interaction["minimumInkEvidencePixelCount"] < 320
            or interaction["minimumInkColorDistance"] < 60
            or interaction["paperLuma"] < 170
            or interaction["paperLuma"] > 245
            or interaction["pixelDrivenSpringStiffness"] < .1
            or interaction["pixelDrivenSpringStiffness"] > .18
            or interaction["pixelDrivenDamping"] < .72
            or interaction["pixelDrivenDamping"] > .84
            or interaction["pixelDrivenSafeDisplacement"] < 14
            or interaction["pixelDrivenSafeDisplacement"] > 21
            or not interaction["pixelEvidenceBoundToTypography"]
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["stageCoverageRatio"] <= .98
            or interaction["canvasCoverageRatio"] <= .98
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted four-ink title tension proofing, exact source-pixel spring evidence, and a retained human-held result without automatic behavior: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "typography-particle-disassembly-field":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        coverage = page.evaluate("""() => {
          const stage = document.querySelector('#release-stage');
          const canvas = document.querySelector('#particle-surface canvas');
          const stageRect = stage.getBoundingClientRect();
          const canvasRect = canvas.getBoundingClientRect();
          return {
            stageWidth: stageRect.width,
            stageHeight: stageRect.height,
            canvasWidth: canvasRect.width,
            canvasHeight: canvasRect.height,
            bodyScrollWidth: document.body.scrollWidth,
            bodyScrollHeight: document.body.scrollHeight,
          };
        }""")
        if (
            not assertion
            or interaction["task"] != "human-operated-music-release-title-to-environment-particle-compositor"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["renderer"] != "canvas2d"
            or interaction["mechanism"] != "glyph-mask-pixels-interpolate-to-same-origin-raster-edge-targets-colors-and-release-judgment"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "range-control", "visible-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialStillVerified"]
            or interaction["automaticPath"]
            or interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["rehearsalMode"]
            or interaction["syntheticInputDispatch"]
            or interaction["previewClockDriven"]
            or interaction["previewClockMutation"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewRenderMutationCount"] != 0
            or interaction["nonInputMutationCount"] != 0
            or interaction["inputCount"] < 14
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedCount"] != 0
            or interaction["hoverInputCount"] < 2
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 10
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerCaptured"]
            or interaction["keyboardInputCount"] != 0
            or interaction["rangeInputCount"] != 0
            or interaction["buttonActivationCount"] != 2
            or interaction["balanceActivationCount"] != 1
            or interaction["approveActivationCount"] != 1
            or interaction["resetActivationCount"] != 0
            or interaction["approvalBlockedCount"] != 0
            or interaction["progressMutationCount"] < 5
            or interaction["probeMutationCount"] < 5
            or interaction["approvedMutationCount"] != 1
            or abs(interaction["progress"] - interaction["recommendedProgress"]) > .001
            or interaction["publishScore"] != interaction["recommendedScore"]
            or not interaction["approved"]
            or interaction["lastInputKind"] != "button"
            or interaction["lastInputSource"] != "button-approve"
            or interaction["lastInputTrusted"] is not True
            or interaction["assetFetchCount"] != 1
            or interaction["assetFetchStatus"] != 200
            or not interaction["assetMimeType"].startswith("image/jpeg")
            or interaction["assetByteLength"] != 184646
            or interaction["assetSha256"] != "222c86cc8eac6ed3b369dc4e14053f3c0f40d495eeb3da2672b6a74ad8ed7141"
            or not interaction["assetChecksumVerified"]
            or interaction["assetDecodeCount"] != 1
            or not interaction["assetDecoded"]
            or interaction["assetNaturalWidth"] != 960
            or interaction["assetNaturalHeight"] != 640
            or interaction["sampledPixelCount"] != 9600
            or interaction["sampledByteLength"] != 38400
            or interaction["sampledPixelChecksum"] <= 0
            or interaction["sampledLuminanceRange"] <= 100
            or interaction["sampledEdgeMean"] <= .015
            or interaction["sampledEdgeMaximum"] <= .2
            or interaction["sampledChromaMean"] <= .08
            or interaction["glyphParticleCount"] < 1800
            or interaction["targetCandidateCount"] < 3500
            or interaction["targetAssignmentCount"] != interaction["glyphParticleCount"]
            or interaction["uniqueTargetCount"] < 1400
            or interaction["particleTargetChecksum"] <= 0
            or interaction["targetQualityScore"] < .58
            or interaction["recommendedProgress"] <= .2
            or interaction["recommendedProgress"] >= .82
            or interaction["recommendedScore"] < 70
            or not interaction["p5ImageLoaded"]
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or not interaction["p5CanvasCreated"]
            or interaction["p5ImageDrawCount"] < 1
            or interaction["particleDrawCount"] < interaction["glyphParticleCount"]
            or interaction["p5DrawCount"] < 10
            or interaction["renderedSampleCount"] < 1000
            or interaction["renderedPixelChecksum"] <= 0
            or interaction["renderedLuminanceRange"] <= 100
            or coverage["stageWidth"] < 319
            or coverage["stageHeight"] < 179
            or coverage["canvasWidth"] < 319
            or coverage["canvasHeight"] < 179
            or coverage["bodyScrollWidth"] > 320
            or coverage["bodyScrollHeight"] > 180
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted LOW TIDE glyph-to-image particle composition, exact source evidence, full-stage p5 rendering, and a retained human approval without automatic behavior: assertion={assertion!r}; interaction={interaction!r}; coverage={coverage!r}")
    elif demo["id"] == "flow-field-ribbon-advection":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        coverage = page.evaluate("""() => {
          const stage = document.querySelector('#route-stage');
          const canvas = document.querySelector('#route-surface canvas');
          const stageRect = stage.getBoundingClientRect();
          const canvasRect = canvas.getBoundingClientRect();
          return {
            stageWidth: stageRect.width,
            stageHeight: stageRect.height,
            canvasWidth: canvasRect.width,
            canvasHeight: canvasRect.height,
            bodyScrollWidth: document.body.scrollWidth,
            bodyScrollHeight: document.body.scrollHeight,
          };
        }""")
        if (
            not assertion
            or interaction["task"] != "human-operated-north-atlantic-passage-current-and-grounding-risk-routing"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "same-origin-image-pixels-drive-p5-flow-vector-ribbons-grounding-risk-and-human-rerouted-passage"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "range-control", "visible-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["nonInputVisualMutationCountAfterReady"] != 0
            or interaction["inputCount"] < 14
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["humanMutationCount"] < 10
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 8
            or interaction["hoverMoveCount"] < 2
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerCaptured"]
            or interaction["keyboardInputCount"] != 0
            or interaction["rangeInputCount"] != 2
            or interaction["buttonActivationCount"] != 2
            or interaction["gateMutationCount"] < 5
            or interaction["probeMutationCount"] < 5
            or interaction["draftMutationCount"] != 2
            or interaction["safestRouteActivationCount"] != 1
            or interaction["lockMutationCount"] != 1
            or interaction["resetCount"] != 0
            or interaction["routeRecomputeCount"] < 8
            or not interaction["locked"]
            or interaction["routeRiskScore"] > interaction["initialRouteRiskScore"]
            or interaction["routeRiskScore"] != interaction["safestRouteRiskScore"]
            or interaction["routeChecksum"] <= 0
            or interaction["lastInputKind"] != "button"
            or interaction["lastInputSource"] != "button-lock"
            or interaction["lastInputTrusted"] is not True
            or interaction["pointerTypesSeen"] != ["mouse"]
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or not interaction["assetMimeType"].startswith("image/jpeg")
            or interaction["assetByteLength"] != 266749
            or interaction["assetSha256"] != "e732c36053e0657291b4846ff0e1ef2d2d484f31bc886709cf271c7329cd1b3b"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["sampledWidth"] != 96
            or interaction["sampledHeight"] != 64
            or interaction["sampledPixelCount"] != 6144
            or interaction["sampledPixelByteLength"] != 24576
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["sampledPixelChecksum"] <= 0
            or interaction["distinctSampleColorCount"] <= 100
            or interaction["sampledLuminanceRange"] <= .2
            or interaction["sampledCyanSignalRange"] <= .1
            or interaction["flowVectorCount"] != 6144
            or interaction["flowVectorChecksum"] <= 0
            or interaction["flowMagnitudeRange"] <= .1
            or interaction["hazardRange"] <= .1
            or not interaction["rasterDrivenEvidenceReady"]
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["p5CompletedDrawCount"] < 10
            or interaction["p5ImageDrawCount"] < 1
            or interaction["streamlineDrawCount"] < 34
            or interaction["streamlineSegmentDrawCount"] <= 400
            or interaction["routeSegmentDrawCount"] < 55
            or interaction["renderedSampleCount"] <= 1000
            or interaction["renderedPixelChecksum"] <= 0
            or interaction["renderedLuminanceRange"] <= 40
            or coverage["stageWidth"] < 319
            or coverage["stageHeight"] < 179
            or coverage["canvasWidth"] < 319
            or coverage["canvasHeight"] < 179
            or coverage["bodyScrollWidth"] > 320
            or coverage["bodyScrollHeight"] > 180
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted pixel-derived passage rerouting, exact North Atlantic source evidence, full-stage p5 currents, and a retained safest locked route without automatic behavior: assertion={assertion!r}; interaction={interaction!r}; coverage={coverage!r}")
    elif demo["id"] == "signed-distance-neon-metaballs":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-coastal-emergency-radio-relay-coverage-planning"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "committed-photo-pixels-seed-three-evidence-bound-relays-whose-human-positioned-inverse-square-fields-form-a-thresholded-metaball-mesh"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "visible-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticOrbit"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["nonInputVisualMutationCountAfterReady"] != 0
            or interaction["inputCount"] < 10
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 6
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerCaptured"]
            or interaction["dragMutationCount"] < 5
            or interaction["keyboardInputCount"] != 0
            or interaction["buttonActivationCount"] != 2
            or interaction["buttonMutationCount"] != 2
            or interaction["gainAdjustmentCount"] != 2
            or interaction["resetCount"] != 0
            or interaction["humanVisualMutationCount"] < 7
            or interaction["humanInputCausalityCount"] < 7
            or interaction["maximumNodeTravel"] <= 0
            or interaction["currentVisualStateChecksum"] == interaction["initialVisualStateChecksum"]
            or interaction["currentConnectedPairCount"] != 3
            or interaction["currentCoveragePercent"] < 42
            or interaction["currentMeshDecision"] != "Mesh route ready"
            or interaction["lastInputKind"] != "button"
            or interaction["lastInputSource"] != "increase"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or not interaction["assetMimeType"].startswith("image/jpeg")
            or interaction["assetByteLength"] != 256210
            or interaction["assetSha256"] != "72e39808792fd76a19c3f7afeee7e874f30cd15a62fe60e2a8637832d81df07a"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["assetByteLengthMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["sampledWidth"] != 160
            or interaction["sampledHeight"] != 90
            or interaction["sampledPixelCount"] != 14400
            or interaction["sampledByteLength"] != 57600
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["distinctQuantizedColorCount"] <= 90
            or interaction["sampleLumaRange"] <= .45
            or interaction["sampleEdgeRange"] <= .12
            or interaction["evidenceClassCount"] != 3
            or len(interaction["nodeEvidence"]) != 3
            or any(item["evidencePixels"] <= 20 for item in interaction["nodeEvidence"])
            or interaction["evidenceBindingChecksum"] <= 0
            or not interaction["pixelEvidenceReady"]
            or not interaction["assetEvidenceReady"]
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["p5CompletedDrawCount"] < 8
            or interaction["fieldEvaluationCount"] < 14400 * 8
            or interaction["thresholdedFieldCellCount"] <= 100
            or interaction["signedDistanceContourCellCount"] <= 20
            or interaction["currentFieldChecksum"] <= 0
            or interaction["stageCoverageRatio"] <= .96
            or interaction["canvasCoverageRatio"] <= .96
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted coastal relay dragging, two human gain adjustments, exact three-colour source evidence, full-stage p5 coverage, and a retained three-link mesh without automatic orbit: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "elastic-svg-rope-lettering":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        coverage = page.evaluate("""() => {
          const stage = document.querySelector('#rope-stage');
          const svg = document.querySelector('#rope-workbench');
          const stageRect = stage.getBoundingClientRect();
          const svgRect = svg.getBoundingClientRect();
          return {
            stageWidth: stageRect.width,
            stageHeight: stageRect.height,
            svgWidth: svgRect.width,
            svgHeight: svgRect.height,
            bodyScrollWidth: document.body.scrollWidth,
            bodyScrollHeight: document.body.scrollHeight,
          };
        }""")
        material_pixel_count = sum(profile["pixelCount"] for profile in interaction["materialProfiles"])
        if (
            not assertion
            or interaction["task"] != "human-operated-material-aware-elastic-rope-wayfinding-lettering-proof"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["renderer"] != "svg"
            or interaction["mechanism"] != "browser-decoded-rope-source-pixels-drive-material-corner-radius-stroke-coupling-load-and-legibility-while-trusted-human-input-edits-svg-path-nodes"
            or interaction["acceptedInputs"] != ["trusted-mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "visible-material-buttons", "visible-tension-button", "visible-lock-button", "visible-reset-button", "keyboard"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or not interaction["motionControlReady"]
            or interaction["motionControlSeekCount"] < 1
            or interaction["motionControlTime"] < 0
            or interaction["motionControlTime"] > 1
            or interaction["inputCount"] < 15
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["hoverInputCount"] < 2
            or interaction["pointerDownCount"] != 1
            or interaction["pointerDragCount"] < 7
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerCaptured"]
            or interaction["mouseInputCount"] < 10
            or interaction["keyboardInputCount"] != 3
            or interaction["keyboardMutationCount"] != 3
            or interaction["buttonInputCount"] != 3
            or interaction["materialSelectionCount"] != 1
            or interaction["tensionToggleCount"] != 1
            or interaction["lockToggleCount"] != 1
            or interaction["resetCount"] != 0
            or interaction["shapeMutationCount"] < 8
            or interaction["humanVisualMutationCount"] < 12
            or interaction["selectedMaterial"] != "coral"
            or interaction["tensionMode"] != "firm"
            or not interaction["locked"]
            or interaction["maximumRecordedNodeDisplacement"] <= 20
            or interaction["maximumDragDistance"] <= 20
            or interaction["legibilityScore"] < 60
            or interaction["loadEstimate"] <= 0
            or interaction["decision"] != "pass"
            or interaction["lastInputKind"] != "visible-lock-button"
            or interaction["lastInputSource"] != "button"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["pointerTypesSeen"] != ["mouse"]
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or not interaction["assetMimeType"].startswith("image/jpeg")
            or interaction["assetByteLength"] != 361333
            or interaction["assetSha256"] != "3262bccad6dfa4bfafa62ecf3cfae47592fe2ce2cfee030816736464446ee046"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["decodedWidth"] != 960
            or interaction["decodedHeight"] != 640
            or interaction["sampledWidth"] != 96
            or interaction["sampledHeight"] != 64
            or interaction["sampledPixelCount"] != 6144
            or interaction["sampledPixelByteLength"] != 24576
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or len(interaction["sampledPixelChecksum"]) != 8
            or interaction["sampledOpaquePixelCount"] != 6144
            or sum(interaction["classificationCounts"].values()) != 6144
            or interaction["distinctSampleColorCount"] <= 300
            or interaction["sampledLumaRange"] <= 145
            or interaction["sampledEdgeMean"] <= 4
            or interaction["sampledSaturationMean"] <= .12
            or interaction["detectedMaterialCount"] != 4
            or len(interaction["materialProfiles"]) != 4
            or material_pixel_count <= 800
            or any(profile["pixelCount"] < 30 or profile["edgeMean"] <= 0 or profile["contrastRatio"] <= 1 for profile in interaction["materialProfiles"])
            or interaction["materialButtonsCreated"] != 4
            or not interaction["pixelEvidenceBoundToLetterform"]
            or interaction["pixelDrivenCornerRadius"] < 2.25
            or interaction["pixelDrivenCornerRadius"] > 5.4
            or interaction["initialPathData"] == interaction["currentPathData"]
            or interaction["basePathLength"] <= 420
            or interaction["currentPathLength"] <= 400
            or interaction["stageWidth"] < 319
            or interaction["stageHeight"] < 179
            or interaction["signCoverageRatio"] <= .31
            or coverage["stageWidth"] < 319
            or coverage["stageHeight"] < 179
            or coverage["svgWidth"] < 319
            or coverage["svgHeight"] < 179
            or coverage["bodyScrollWidth"] > 320
            or coverage["bodyScrollHeight"] > 180
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted material-aware TIDE rope editing, exact source-pixel profiles, full-stage native SVG deformation, and a retained firm locked proof without automatic behavior: assertion={assertion!r}; interaction={interaction!r}; coverage={coverage!r}")
    elif demo["id"] == "boids-flock-pointer-avoidance":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-fictional-terminal-crowd-clearance-route-test"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "decoded-survey-luminance-chroma-and-edges-drive-boids-navigation-risk-and-avoidance"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "range-control", "visible-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStaticConfirmed"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["nonInputVisualMutationCountAfterReady"] != 0
            or interaction["inputCount"] < 9
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["humanMutationCount"] < 10
            or interaction["humanSimulationStepCount"] < 5
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 6
            or interaction["pointerDragCount"] < 5
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerCaptured"]
            or interaction["hoverMutationCount"] < 1
            or interaction["dragMutationCount"] < 5
            or interaction["radiusMutationCount"] < 1
            or interaction["rangeInputCount"] < 1
            or interaction["zoneRadiusMetres"] != 30
            or interaction["buttonInputCount"] != 0
            or interaction["keyboardInputCount"] != 0
            or interaction["currentVisualStateChecksum"] == interaction["initialVisualStateChecksum"]
            or interaction["agentStateChecksum"] == interaction["initialAgentStateChecksum"]
            or interaction["minimumClearanceScore"] > 40
            or interaction["clearanceScore"] < 80
            or interaction["agentsInsideExclusion"] != 0
            or interaction["routeConclusion"] != "CLEAR"
            or interaction["routeConclusionMutationCount"] < 2
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or not interaction["assetMimeType"].startswith("image/jpeg")
            or interaction["assetByteLength"] != 235229
            or interaction["assetSha256"] != "944859c4123d5446e09e45f55a273d636c5e0cfde082ee57e44d563aea74232e"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or interaction["sourcePixelCount"] != 614400
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["sampledWidth"] != 96
            or interaction["sampledHeight"] != 54
            or interaction["sampledPixelCount"] != 5184
            or interaction["sampledByteLength"] != 20736
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["sampledPixelChecksum"] <= 0
            or interaction["distinctSampleColorCount"] <= 250
            or interaction["nonzeroSampleByteCount"] <= 15552
            or interaction["sampledLuminanceRange"] <= .45
            or interaction["sampledEdgeRange"] <= .35
            or interaction["navigationRiskRange"] <= .45
            or interaction["highRiskCellCount"] <= 250
            or interaction["safeCellCount"] <= 400
            or interaction["edgeSampleCount"] != 10218
            or interaction["fieldCoordinateChecksum"] <= 0
            or not interaction["fieldEvidenceReady"]
            or interaction["agentCount"] < 30
            or interaction["agentCount"] > 42
            or not interaction["agentCountDerivedFromPixels"]
            or interaction["avoidanceWeight"] < 1.2
            or interaction["avoidanceWeight"] > 2.6
            or not interaction["avoidanceWeightDerivedFromPixels"]
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["p5CompletedDrawCount"] < 8
            or interaction["p5ImageDrawCount"] < 1
            or interaction["boidDrawCount"] < interaction["agentCount"]
            or not interaction["animationSettled"]
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted CLEAR-to-DIVERT-to-CLEAR terminal egress routing, exact source-pixel risk evidence, finite boid steps, and a retained full-stage result without automatic simulation: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "recursive-quadtree-pulse-mosaic":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "p5-pixel-sampled-quadtree-lod-inspection"
            or interaction["causality"] != "trusted-human-input-only"
            or interaction["automaticPlayback"]
            or interaction["automaticCycle"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["trustedInputCount"] < 15
            or interaction["pointerDownCount"] != 1
            or interaction["pointerUpCount"] != 1
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or interaction["pointerMoveCount"] < 7
            or interaction["dragMoveCount"] < 5
            or interaction["hoverMoveCount"] < 2
            or interaction["keyboardCount"] != 4
            or interaction["controlCount"] != 1
            or interaction["resetCount"] != 1
            or interaction["visualRevision"] < 15
            or not interaction["topologyChangedByHuman"]
            or interaction["lastInputTrusted"] is not True
            or interaction["lastInputKind"] != "pointer-hover"
            or interaction["lastPointerType"] != "mouse"
            or interaction["detailLevel"] != 2
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 372834
            or interaction["assetSha256"] != "c75158904bebaf28e77b7217e3b4bda5b40be4ba10e28c1879b04e98f2620151"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["sampledWidth"] != 96
            or interaction["sampledHeight"] != 54
            or interaction["sampledPixelCount"] != 5184
            or interaction["sampledByteLength"] != 20736
            or len(interaction["sourcePixelSha256"]) != 64
            or not interaction["sourcePixelSha256"].strip("0")
            or interaction["distinctSampleColorCount"] <= 500
            or interaction["maximumLuma"] - interaction["minimumLuma"] <= 140
            or interaction["averageTexture"] <= 10
            or interaction["maximumTexture"] <= 60
            or interaction["textureCellCount"] <= 500
            or interaction["waterPixelCount"] <= 300
            or interaction["vegetationPixelCount"] <= 500
            or interaction["dryPixelCount"] <= 100
            or interaction["brightPixelCount"] <= 30
            or interaction["classificationChecksum"] <= 0
            or interaction["rootCount"] != 1
            or interaction["leafCount"] <= 100
            or interaction["totalNodeCount"] != interaction["internalNodeCount"] + interaction["leafCount"]
            or interaction["childLinkCount"] != interaction["internalNodeCount"] * 4
            or interaction["leafCount"] != interaction["internalNodeCount"] * 3 + 1
            or sum(interaction["depthHistogram"]) != interaction["leafCount"]
            or interaction["leafCoveragePixels"] != 5184
            or interaction["leafCoverageRatio"] != 1
            or interaction["overlapOrGapCount"] != 0
            or interaction["maximumTreeDepth"] < 3
            or interaction["pixelDrivenSplitCount"] <= 0
            or interaction["focusDrivenSplitCount"] <= 0
            or interaction["topologyChecksum"] <= 0
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["completedDrawCount"] < 15
            or not interaction["initialStaticConfirmed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted full-stage coastal quadtree LOD review with exact source evidence, verified topology and a retained human-owned focus without automatic motion: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "delaunay-triangulated-light-sweep":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-pixel-derived-delaunay-composite-inspection"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "committed-laminate-pixels-drive-delaunay-vertices-face-material-and-defect-signal"
            or interaction["acceptedInputs"] != ["mouse-hover", "mouse-drag", "touch-drag", "pen-drag", "keyboard", "button-control", "range-control"]
            or not interaction["userInputRequired"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStaticConfirmed"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["inputCount"] < 14
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 6
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerReleaseCaptureCount"] != 1
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or interaction["keyboardInputCount"] != 2
            or interaction["buttonActivationCount"] != 2
            or interaction["rangeInputCount"] != 2
            or interaction["humanMutationCount"] < 10
            or interaction["seamPresetCount"] != 1
            or interaction["voidPresetCount"] != 1
            or interaction["resetCount"] != 0
            or interaction["beamRadius"] != 28
            or interaction["lastInputTrusted"] is not True
            or interaction["lastInputKind"] != "keyboard-]"
            or interaction["lastPointerType"] != "mouse"
            or interaction["visitedClassCount"] < 2
            or interaction["maximumSignal"] <= 0
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 353080
            or interaction["assetSha256"] != "7836b637c6d44e631e61b15bf99afb0d70c67a3075b82d3eb3bc40f596c7a837"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["sampledWidth"] != 96
            or interaction["sampledHeight"] != 54
            or interaction["sampledPixelCount"] != 5184
            or interaction["sampledByteLength"] != 20736
            or len(interaction["sourcePixelSha256"]) != 64
            or not interaction["sourcePixelSha256"].strip("0")
            or interaction["distinctSampleColorCount"] <= 300
            or interaction["sampledLumaRange"] <= .5
            or interaction["candidateCellCount"] <= 100
            or interaction["imageDrivenVertexCount"] <= 50
            or interaction["boundaryVertexCount"] < 30
            or interaction["vertexCount"] < 90
            or interaction["triangleCount"] <= interaction["vertexCount"]
            or interaction["uniqueEdgeCount"] <= interaction["triangleCount"]
            or interaction["degenerateTriangleCount"] != 0
            or interaction["delaunayEmptyCircleViolations"] != 0
            or interaction["topologyChecksum"] <= 0
            or interaction["facePropertyChecksum"] <= 0
            or interaction["laminateTriangleCount"] <= 0
            or interaction["edgeTriangleCount"] <= 0
            or interaction["anomalyTriangleCount"] <= 0
            or interaction["laminateTriangleCount"] + interaction["edgeTriangleCount"] + interaction["anomalyTriangleCount"] != interaction["triangleCount"]
            or not interaction["assetEvidenceReady"]
            or not interaction["topologyReady"]
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["p5CompletedDrawCount"] < 10
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted full-stage composite laminate Delaunay inspection with exact source evidence, valid topology, multiple material classes and a retained human-owned beam: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "topographic-wave-contour-reveal":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-fictional-watershed-route-and-flood-contour-survey"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "real-raster-pixels-to-smoothed-elevation-field-marching-squares-flood-risk-and-safe-route"
            or interaction["acceptedInputs"] != ["mouse-hover", "mouse-drag", "touch-drag", "pen-drag", "keyboard", "button", "range"]
            or interaction["causality"] != "trusted-human-input-only"
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["nonInputVisualMutationCountAfterReady"] != 0
            or interaction["inputCount"] < 14
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerDragCount"] < 5
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or interaction["buttonInputCount"] != 2
            or interaction["keyboardInputCount"] != 0
            or interaction["rangeInputCount"] != 0
            or interaction["mouseInputCount"] < 10
            or interaction["humanMutationCount"] < 12
            or interaction["revealMutationCount"] < 6
            or interaction["floodMutationCount"] < 6
            or interaction["probeMutationCount"] < 6
            or interaction["resetCount"] != 0
            or interaction["reveal"] <= .72
            or interaction["floodStage"] <= .43
            or interaction["probeRiskLabel"] != "HIGH"
            or interaction["lastInputKind"] != "button"
            or interaction["lastInputSource"] != "button-raise"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetMimeType"].startswith("image/jpeg")
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 379323
            or interaction["assetSha256"] != "1821a74b46476b03c5f0aa9a8105c03602873e1ea0ba076da7084daf340e2522"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["sampledWidth"] != 80
            or interaction["sampledHeight"] != 45
            or interaction["sampledPixelCount"] != 3600
            or interaction["sampledPixelByteLength"] != 14400
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["sampledPixelChecksum"] <= 0
            or interaction["distinctSampleColorCount"] <= 350
            or interaction["sourceAlphaFailureCount"] != 0
            or interaction["sampledLuminanceRange"] <= .45
            or interaction["elevationCellCount"] != 3600
            or interaction["elevationRange"] != 1
            or interaction["elevationChecksum"] <= 0
            or interaction["riskCellCount"] != 3600
            or interaction["riskRange"] <= .45
            or interaction["riskChecksum"] <= 0
            or interaction["smoothingPassCount"] != 2
            or interaction["marchingSquaresLevelCount"] != 9
            or interaction["marchingSquaresCellEvaluationCount"] != 31284
            or interaction["marchingSquaresSegmentCount"] <= 350
            or interaction["contourLevelsWithSegments"] < 8
            or interaction["contourTopologyChecksum"] <= 0
            or interaction["routePointCount"] != 80
            or interaction["routePixelEvaluationCount"] <= 3600
            or interaction["routeRecomputeCount"] < 1
            or interaction["routeChecksum"] <= 0
            or not interaction["rasterDrivenEvidenceReady"]
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["p5CompletedDrawCount"] < 12
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted full-stage alpine watershed contour and flood review with exact source evidence, a real safe route and a retained high-risk human-owned result: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "typographic-time-slit":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-fictional-editorial-version-proof-inspection"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["renderer"] != "canvas2d"
            or interaction["mechanism"] != "trusted-human-input-directly-moves-a-horizontal-p5-clip-between-two-pixel-proven-editorial-versions"
            or interaction["assetMechanismRole"] != "decoded-left-and-right-proof-pixels-drive-both-visible-timelines-change-regions-palette-score-and-acceptance"
            or interaction["acceptedInputs"] != ["mouse-hover", "mouse-drag", "touch-drag", "pen-drag", "keyboard", "button-control"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStaticConfirmed"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["previewClockIgnoredCount"] < 1
            or interaction["inputCount"] < 15
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 8
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or interaction["hoverInputCount"] < 4
            or interaction["capturedPointerMoveCount"] < 4
            or interaction["keyboardInputCount"] != 2
            or interaction["buttonActivationCount"] != 4
            or interaction["hoverMutationCount"] < 3
            or interaction["dragMutationCount"] < 3
            or interaction["keyboardMutationCount"] != 2
            or interaction["buttonMutationCount"] != 4
            or interaction["slitMutationCount"] < 12
            or interaction["humanInputCausalityCount"] != interaction["slitMutationCount"]
            or interaction["distinctVisitedBandCount"] < 3
            or interaction["selectedBandLabel"] != "STRUCTURE"
            or interaction["lastInputKind"] != "pointer-hover"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["slitPosition"] < .5
            or interaction["slitPosition"] > .56
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or not interaction["assetMimeType"].startswith("image/jpeg")
            or interaction["assetByteLength"] != 201120
            or interaction["assetSha256"] != "c198935149ddc604574425ab9c5934025e8495e6b96d663be8cbefdc7ec12bfa"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["sampledWidth"] != 72
            or interaction["sampledHeight"] != 72
            or interaction["sampledPixelCountPerVersion"] != 5184
            or interaction["sampledPixelByteLengthPerVersion"] != 20736
            or interaction["comparedPixelCount"] != 5184
            or len(interaction["comparisonPixelSha256"]) != 64
            or not interaction["comparisonPixelSha256"].strip("0")
            or not interaction["comparisonPixelShaValid"]
            or interaction["distinctSampleColorCount"] <= 350
            or interaction["changedPixelCount"] <= 3000
            or interaction["changedPixelRatio"] <= .35
            or interaction["changedPixelRatio"] >= 1
            or interaction["meanPixelDelta"] <= 18
            or interaction["maximumPixelDelta"] <= interaction["meanPixelDelta"]
            or interaction["tileCount"] != 48
            or interaction["changedTileCount"] < 10
            or len(interaction["tileEvidence"]) != 48
            or len(interaction["rowEvidence"]) != 6
            or len(interaction["beforeAverageRgb"]) != 3
            or len(interaction["afterAverageRgb"]) != 3
            or len(interaction["releaseAccentRgb"]) != 3
            or interaction["evidenceScore"] < interaction["acceptanceThreshold"]
            or interaction["acceptanceOutcome"] != "PASS"
            or not interaction["assetEvidenceReady"]
            or not interaction["pixelEvidenceReady"]
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["p5CompletedDrawCount"] < 12
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted full-stage editorial Draft-to-Release time-slit inspection with exact source evidence, multiple changed bands and a retained pixel-proven PASS without automatic motion: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "moire-tunnel-zoom":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        profile_pixel_total = sum(profile["samplePixelCount"] for profile in interaction["channelProfiles"])
        if (
            not assertion
            or interaction["task"] != "human-operated-pixel-evidenced-optical-channel-inspection"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["renderer"] != "canvas2d"
            or interaction["mechanism"] != "trusted-human-input-scrubs-a-finite-p5-moire-tunnel-over-a-browser-decoded-optical-master"
            or interaction["assetMechanismRole"] != "exact-source-pixels-determine-channel-line-density-ring-count-axis-ellipse-ratio-accent-vanishing-point-risk-and-inspection-conclusion"
            or interaction["causality"] != "trusted-human-input-only"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "range-control", "channel-buttons", "visible-action-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticTimeline"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["visualMutationFromPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["inputCount"] < 18
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["humanInputCausalityCount"] < 14
            or interaction["humanVisualMutationCount"] < 12
            or interaction["hoverInputCount"] < 1
            or interaction["pointerMoveCount"] < 7
            or interaction["pointerDownCount"] != 1
            or interaction["pointerDragCount"] < 6
            or interaction["pointerUpCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerCaptured"]
            or interaction["dragging"]
            or interaction["activePointerId"] is not None
            or interaction["mouseInputCount"] < 9
            or interaction["touchInputCount"] != 0
            or interaction["penInputCount"] != 0
            or interaction["keyboardInputCount"] != 2
            or interaction["rangeInputCount"] != 2
            or interaction["channelButtonInputCount"] != 1
            or interaction["actionButtonInputCount"] != 5
            or interaction["assessmentCount"] != 2
            or interaction["undoCount"] != 1
            or interaction["resetCount"] != 1
            or interaction["selectedChannelIndex"] != 0
            or interaction["selectedChannelId"] != "CH-01"
            or interaction["selectedChannelConclusion"] != "AWAIT"
            or interaction["assessedChannelCount"] != 0
            or interaction["depth"] != 8
            or interaction["maximumDepth"] <= interaction["initialDepth"]
            or interaction["lastInputKind"] != "action-button"
            or interaction["lastInputSource"] != "reset"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["pointerTypesSeen"] != ["mouse"]
            or interaction["sourceAssetKind"] != "built-in-imagegen-fictional-optical-calibration-master"
            or not interaction["sourceAssetFictional"]
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetMimeType"].startswith("image/jpeg")
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 270948
            or interaction["assetSha256"] != "08529c25ab1262a8b675f82671859c6febaa3326e7b4d199ae640b2ffd6e6eec"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or interaction["sourcePixelCount"] != 614400
            or not interaction["browserCanvasReadback"]
            or interaction["sampledWidth"] != 96
            or interaction["sampledHeight"] != 54
            or interaction["sampledPixelCount"] != 5184
            or interaction["sampledPixelByteLength"] != 20736
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["sampledOpaquePixelCount"] != 5184
            or interaction["distinctSampleColorCount"] <= 80
            or interaction["sampledLuminanceRange"] <= .25
            or interaction["sampledLuminanceStdDev"] <= .06
            or interaction["sampledEdgeMean"] <= .008
            or interaction["apertureCandidateCount"] < 8
            or interaction["apertureCentroidU"] < interaction["apertureRegion"]["x0"]
            or interaction["apertureCentroidU"] > interaction["apertureRegion"]["x1"]
            or interaction["apertureCentroidV"] < interaction["apertureRegion"]["y0"]
            or interaction["apertureCentroidV"] > interaction["apertureRegion"]["y1"]
            or interaction["channelProfileCount"] != 4
            or len(interaction["channelProfiles"]) != 4
            or profile_pixel_total <= 2600
            or any(profile["samplePixelCount"] <= 500 for profile in interaction["channelProfiles"])
            or interaction["distinctRingCountCount"] != 4
            or interaction["minimumChannelDensityDelta"] <= .001
            or interaction["distinctAxisDegreeCount"] < 2
            or interaction["channelAxisDegreeSpan"] <= 1
            or interaction["distinctRiskCount"] < 3
            or len(interaction["profileEvidenceChecksum"]) != 8
            or not interaction["pixelEvidenceBoundToDensity"]
            or not interaction["pixelEvidenceBoundToVanishingPoint"]
            or not interaction["pixelEvidenceBoundToConclusion"]
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or not interaction["p5NoLoop"]
            or interaction["p5CompletedDrawCount"] < 12
            or interaction["p5SourceDrawCount"] < 1
            or interaction["stageWidth"] != 320
            or interaction["stageHeight"] != 180
            or interaction["canvasWidth"] != 320
            or interaction["canvasHeight"] != 180
            or interaction["stageCoverageRatio"] < .98
            or interaction["canvasCoverageRatio"] < .98
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted full-stage four-channel optical Moire calibration with exact source evidence, finite p5 depth changes, assessment/undo/reset and no automatic tunnel motion: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "procedural-folding-kaleidoscope":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-wrapping-paper-folding-proof"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "local-raster-sampled-into-clipped-alternating-mirror-sectors"
            or interaction["captureType"] != "interactive"
            or interaction["causality"] != "trusted-human-input-only"
            or interaction["acceptedInputs"] != ["mouse-hover", "mouse-drag", "touch-drag", "pen-drag", "keyboard", "button"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or interaction["automaticPath"]
            or interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["rehearsalMode"]
            or interaction["previewClockDriven"]
            or interaction["previewClockMutation"]
            or interaction["visualMutationFromPreviewClock"]
            or interaction["syntheticInputDispatch"]
            or interaction["nonInputMutationCount"] != 0
            or not interaction["initialStillVerified"]
            or interaction["inputCount"] < 10
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedCount"] != 0
            or interaction["hoverInputCount"] < 3
            or interaction["mouseInputCount"] < 5
            or interaction["touchInputCount"] != 0
            or interaction["penInputCount"] != 0
            or interaction["keyboardInputCount"] != 2
            or interaction["buttonInputCount"] != 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerDragCount"] != 3
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or interaction["mutationCount"] < 9
            or interaction["humanMutationCount"] != interaction["mutationCount"]
            or interaction["foldMutationCount"] < 4
            or interaction["sampleMutationCount"] < 7
            or interaction["resetCount"] != 0
            or interaction["lastInputKind"] != "keyboard"
            or interaction["lastInputSource"] != "keyboard-ArrowLeft"
            or interaction["lastInputTrusted"] is not True
            or interaction["folds"] != 7
            or interaction["currentSectorCount"] != 14
            or interaction["currentMirroredSectorCount"] != 7
            or interaction["currentClipCount"] != 14
            or len(interaction["topologyRecords"]) != 14
            or interaction["assetFetchCount"] != 1
            or interaction["assetFetchStatus"] != 200
            or not interaction["assetMimeType"].startswith("image/jpeg")
            or interaction["assetByteLength"] != 578402
            or interaction["assetSha256"] != "ce776202b72992c05a4e41e03d2e5ddc4f89289dc4599833b802aadab66af6a6"
            or not interaction["assetChecksumVerified"]
            or not interaction["assetDecoded"]
            or interaction["assetDecodeCount"] != 1
            or interaction["assetNaturalWidth"] != 960
            or interaction["assetNaturalHeight"] != 960
            or not interaction["p5ImageCreated"]
            or interaction["p5ImagePixelCount"] != 921600
            or interaction["p5ImagePixelByteLength"] != 3686400
            or interaction["sourcePixelChecksum"] <= 0
            or interaction["sourceDistinctColorBuckets"] <= 100
            or interaction["sourceLuminanceRange"] <= 150
            or interaction["samplePixelCount"] <= 1000
            or interaction["samplePixelChecksum"] <= 0
            or interaction["sampleDistinctColorBuckets"] <= 32
            or interaction["sampleLuminanceRange"] <= 72
            or interaction["sampleInkCoverage"] <= .08
            or interaction["sampleInkCoverage"] >= .96
            or interaction["printVerdict"] != "PRESS READY"
            or not interaction["p5CanvasCreated"]
            or interaction["p5DrawCount"] < 9
            or interaction["p5ImageDrawCalls"] < interaction["currentSectorCount"] + 1
            or interaction["sourcePreviewDrawCalls"] <= 0
            or interaction["topologySectorDrawCalls"] < interaction["currentSectorCount"]
            or interaction["lastDrawnAssetSha256"] != interaction["expectedAssetSha256"]
            or interaction["renderedSampleCount"] <= 1000
            or interaction["renderedPixelChecksum"] <= 0
            or interaction["renderedLuminanceRange"] <= 150
            or not interaction["ready"]
            or not interaction["listenersBound"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted full-stage wrapping-print kaleidoscope sampler with exact p5.Image source evidence, seven-fold alternating mirror topology and no automatic motion: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "elastic-baseline-letter-wave":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-wayfinding-elastic-baseline-legibility-proof"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "code-native-glyphs-inherit-position-and-tangent-from-a-24-node-finite-spring-baseline"
            or interaction["assetStrategy"] != "code-native-glyph-mechanism-no-decorative-raster-required"
            or interaction["captureType"] != "interactive"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "range-control", "visible-buttons"]
            or interaction["causality"] != "trusted-human-input-only"
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticWave"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["nonInputVisualMutationCountAfterReady"] != 0
            or interaction["inputCount"] < 9
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["humanMutationCount"] < 8
            or interaction["probeMutationCount"] < 6
            or interaction["tensionMutationCount"] != 0
            or interaction["baselineMutationCount"] < 8
            or interaction["keyboardInputCount"] != 0
            or interaction["rangeInputCount"] != 0
            or interaction["buttonInputCount"] != 1
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerMoveCount"] < 6
            or interaction["pointerDownCount"] != 1
            or interaction["pointerDragCount"] < 5
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerCaptured"]
            or interaction["dragging"]
            or interaction["activePointerId"] is not None
            or interaction["mouseInputCount"] < 8
            or interaction["touchInputCount"] != 0
            or interaction["penInputCount"] != 0
            or interaction["resetCount"] != 0
            or interaction["lastInputKind"] != "button"
            or interaction["lastInputSource"] != "button-settle"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["baselineNodeCount"] != 24
            or interaction["glyphCount"] != 7
            or interaction["solverIterationsPerInput"] != 12
            or interaction["settleIterationsPerInput"] != 28
            or interaction["solverBatchCount"] < 9
            or interaction["settleBatchCount"] != 1
            or interaction["solverIterationCount"] != interaction["solverBatchCount"] * 12 + interaction["settleBatchCount"] * 16
            or interaction["minimumLegibilityScore"] > 80
            or interaction["maximumDisplacementObserved"] <= .1
            or interaction["maximumSlopeObserved"] <= .45
            or interaction["legibilityVerdictMutationCount"] < 2
            or interaction["legibilityScore"] < 98
            or interaction["maximumDisplacement"] >= .01
            or interaction["legibilityVerdict"] != "Route proof clear"
            or interaction["baselineChecksum"] <= 0
            or interaction["initialBaselineChecksum"] <= 0
            or not interaction["glyphBoundsWithinCanvas"]
            or interaction["glyphMetricCount"] != 7
            or interaction["glyphOccludedByUiCount"] != 0
            or interaction["baselineSegmentDrawCount"] != 23
            or interaction["glyphDrawCount"] != 7
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["p5CompletedDrawCount"] < 9
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted full-stage WAYFIND elastic-baseline legibility proof with finite solver batches, unclipped glyphs, optical strain and an explicit settled result without automatic wave motion: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "recursive-arc-forest-growth":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        profile_pixel_total = sum(profile["pixelCount"] for profile in interaction["habitatProfiles"])
        if (
            not assertion
            or interaction["task"] != "human-operated-pixel-seeded-recursive-forest-regeneration-transect"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["renderer"] != "canvas2d"
            or interaction["mechanism"] != "verified-canopy-raster-pixels-drive-five-recursive-tree-depth-spread-bend-color-and-regeneration-verdict"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "range-control", "visible-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["inputCount"] < 18
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["hoverInputCount"] < 2
            or interaction["pointerDownCount"] != 1
            or interaction["pointerDragCount"] < 9
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or interaction["mouseInputCount"] < 12
            or interaction["touchInputCount"] != 0
            or interaction["penInputCount"] != 0
            or interaction["keyboardInputCount"] != 2
            or interaction["rangeInputCount"] != 2
            or interaction["buttonInputCount"] != 2
            or interaction["humanMutationCount"] < 16
            or interaction["progressMutationCount"] < 10
            or interaction["windMutationCount"] < 8
            or interaction["depthMutationCount"] != 1
            or interaction["growCount"] != 2
            or interaction["pruneCount"] != 0
            or interaction["resetCount"] != 0
            or interaction["lastInputKind"] != "keyboard"
            or interaction["lastInputTrusted"] is not True
            or interaction["progress"] < .98
            or interaction["depthBudget"] != 7
            or interaction["activePlot"] != 4
            or interaction["visibleDepth"] < 6
            or interaction["visibleBranchCount"] <= 200
            or interaction["potentialBranchCount"] < interaction["visibleBranchCount"]
            or interaction["regenerationCoverage"] < .8
            or interaction["regenerationCoverage"] > 1
            or interaction["regenerationVerdict"] != "ESTABLISHED"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetMimeType"].startswith("image/jpeg")
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 409376
            or interaction["assetSha256"] != "e577e2a16d3f28702dad076941c461211eab638f16cc92fa7c5883ea710e9878"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["sampledWidth"] != 90
            or interaction["sampledHeight"] != 60
            or interaction["sampledPixelCount"] != 5400
            or interaction["sampledPixelByteLength"] != 21600
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["sampledPixelChecksum"] <= 0
            or interaction["opaqueSamplePixelCount"] != 5400
            or interaction["distinctSampleColorCount"] <= 250
            or interaction["sampledLumaRange"] <= 100
            or interaction["sampledEdgeMean"] <= 4
            or interaction["habitatProfileCount"] != 5
            or len(interaction["habitatProfiles"]) != 5
            or profile_pixel_total != 5400
            or any(profile["pixelCount"] <= 900 or profile["depth"] < 5 or profile["depth"] > 8 or profile["spread"] < .34 or profile["spread"] > .62 or profile["suitability"] < 0 or profile["suitability"] > 1 or profile["checksum"] <= 0 for profile in interaction["habitatProfiles"])
            or not interaction["pixelEvidenceReady"]
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["p5CompletedDrawCount"] < 16
            or interaction["p5ImageDrawCount"] < 1
            or interaction["currentCanvasSignature"] <= 0
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted full-stage pixel-derived coastal canopy regeneration transect with five habitat profiles, finite recursive growth and a retained ESTABLISHED result without automatic motion: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "pointer-woven-ribbon-loom":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        densities = [profile["density"] for profile in interaction["profiles"]]
        axis_ratios = [profile["edgeY"] / profile["edgeX"] for profile in interaction["profiles"]]
        if (
            not assertion
            or interaction["task"] != "human-operated-pixel-derived-textile-structure-proof"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "verified-material-master-pixels-drive-warp-weft-angle-tension-friction-color-and-weave-conclusion"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "range-control", "material-buttons", "visible-action-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticTimeline"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["trustedInputs"] < 17
            or interaction["rejectedInputs"] != 0
            or interaction["humanMutationCount"] != interaction["trustedInputs"]
            or interaction["hoverInputs"] < 3
            or interaction["dragInputs"] != 3
            or interaction["keyboardInputs"] != 2
            or interaction["touchInputs"] != 0
            or interaction["penInputs"] != 0
            or interaction["mouseInputs"] < 8
            or interaction["rangeInputs"] != 2
            or interaction["materialInputs"] != 1
            or interaction["actionInputs"] != 5
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerReleaseCount"] != 1
            or interaction["dragging"]
            or interaction["activePointerId"] is not None
            or interaction["committed"] != []
            or interaction["lastInput"] != "action:reset"
            or len(interaction["history"]) < 15
            or interaction["selected"] != 0
            or interaction["tensionBias"] != 50
            or interaction["source"] is None
            or interaction["source"]["bytes"] != 469833
            or interaction["source"]["width"] != 960
            or interaction["source"]["height"] != 640
            or interaction["source"]["sha256"] != "4086ae488153382f68c8697c4de0f53625ea10d39cf8b8df9a06cf8e25843159"
            or len(interaction["source"]["sampledSha256"]) != 64
            or not interaction["source"]["sampledSha256"].strip("0")
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetMimeType"].startswith("image/jpeg")
            or not interaction["assetSameOrigin"]
            or not interaction["browserImageDecoded"]
            or len(interaction["profiles"]) != 4
            or sorted(profile["name"] for profile in interaction["profiles"]) != ["CROSS", "PLAIN", "SATIN", "TWILL"]
            or len(set(profile["warp"] for profile in interaction["profiles"])) < 3
            or len(set(profile["weft"] for profile in interaction["profiles"])) < 2
            or len(set(profile["conclusion"] for profile in interaction["profiles"])) < 3
            or max(densities) - min(densities) <= 3
            or max(axis_ratios) - min(axis_ratios) <= .05
            or interaction["p5DrawCount"] < 15
            or interaction["setupDrawCount"] != 1
            or interaction["eventRedrawCount"] < 15
            or interaction["canvasCoverage"] is None
            or interaction["canvasCoverage"]["width"] != 320
            or interaction["canvasCoverage"]["height"] != 180
            or interaction["canvasCoverage"]["stageWidth"] != 320
            or interaction["canvasCoverage"]["stageHeight"] != 180
            or interaction["canvasCoverage"]["ratio"] < .98
            or interaction["initialVisualChecksum"] is None
            or interaction["currentVisualChecksum"] != interaction["initialVisualChecksum"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted full-stage pixel-derived material weave specification with four distinct structures, commit/undo/reset, strict control separation and no automatic motion: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "traveling-dot-headline-rewriter":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-approved-headline-revision-with-finite-spatial-marker"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "measured-spatial-marker-erases-current-copy-visits-the-selected-revision-and-writes-the-approved-copy"
            or interaction["assetStrategy"] != "code-native-editorial-typography-no-functional-raster-input-required"
            or interaction["acceptedInputs"] != ["trusted-pointer-click", "trusted-keyboard-activation", "escape-undo", "visible-revision-buttons", "visible-undo-button"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStaticVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticLoop"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["previewClockMutationBeforeInput"]
            or not interaction["previewClockDrivesFiniteTransitionAfterInput"]
            or interaction["inputCount"] != 2
            or interaction["trustedInputCount"] != 2
            or interaction["pointerInputCount"] != 2
            or interaction["keyboardInputCount"] != 0
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["revisionSelectionCount"] != 1
            or interaction["undoCount"] != 1
            or interaction["transitionStartCount"] != 2
            or interaction["transitionCompleteCount"] != 2
            or interaction["textMutationCount"] != 2
            or interaction["finiteTransitionStepCount"] < 20
            or interaction["markerSeekCount"] < 40
            or interaction["motionControlCreateCount"] < 6
            or interaction["currentRevisionId"] != "source-v03"
            or interaction["currentCopy"] != "without the noise."
            or interaction["phase"] != "draft"
            or interaction["transitionActive"]
            or interaction["transitionProgress"] != 1
            or interaction["lastInputTrusted"] is not True
            or interaction["lastInputKind"] != "pointer"
            or interaction["lastInputSource"] != "undo-button"
            or not interaction["geometryValidated"]
            or not interaction["markerWithinWorkspace"]
            or not interaction["motionControlReady"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture two trusted finite headline revision passes with retained copy, explicit undo, full-stage geometry and no automatic motion: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "dom-synced-shader-planes":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-dom-media-card-to-gpu-shader-plane-registration-calibration"
            or interaction["claimedLibrary"] != "curtainsjs@8.1.6"
            or interaction["mechanism"] != "curtainsjs-plane-consumes-the-browser-decoded-image-texture-and-recomputes-its-webgl-plane-from-the-real-dom-card-bounds-after-trusted-human-move-scale-and-layout-input"
            or interaction["acceptedInputs"] != ["trusted-mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "native-range-input", "visible-layout-buttons", "visible-reset-button", "keyboard"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["trustedInputCount"] < 12
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["hoverInputCount"] < 2
            or interaction["pointerDownCount"] != 1
            or interaction["pointerDragCount"] < 4
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or interaction["rangeInputCount"] < 1
            or interaction["layoutChangeCount"] < 2
            or interaction["keyboardInputCount"] < 3
            or interaction["buttonInputCount"] < 3
            or interaction["resetCount"] != 1
            or interaction["humanMutationCount"] < 10
            or interaction["layout"] != "edit"
            or interaction["scalePercent"] != 100
            or abs(interaction["manualOffsetX"]) > .01
            or abs(interaction["manualOffsetY"]) > .01
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetMimeType"].startswith("image/jpeg")
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 132620
            or interaction["assetSha256"] != "217bc3ea171d79543115d14c2b124dee525074ad89cd9679167575db84b9d7a1"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["decodedWidth"] != 960
            or interaction["decodedHeight"] != 600
            or interaction["sampledWidth"] != 64
            or interaction["sampledHeight"] != 40
            or interaction["sampledPixelCount"] != 2560
            or interaction["sampledOpaquePixelCount"] != 2560
            or interaction["distinctSampleColorCount"] <= 120
            or interaction["sampledLumaRange"] <= 150
            or interaction["sampledBlueDominanceRatio"] <= .08
            or interaction["sampledBlueDominanceRatio"] >= .75
            or interaction["sampledWarmPixelRatio"] <= .015
            or interaction["sampledWarmPixelRatio"] >= .3
            or interaction["sampledEdgeMean"] <= 5
            or interaction["sampledEdgeMean"] >= 45
            or interaction["pixelDrivenImageEnergy"] <= .25
            or interaction["pixelDrivenImageEnergy"] >= .95
            or not interaction["pixelEvidenceBoundToShader"]
            or not interaction["webglContextReady"]
            or not interaction["curtainsPlaneReady"]
            or interaction["planeTextureCount"] != 1
            or not interaction["sourceUploadedToPlane"]
            or interaction["planeUpdateCount"] < 12
            or interaction["planeResizeCount"] < 5
            or interaction["curtainsRenderCount"] < 12
            or interaction["currentRegistrationError"] > .75
            or interaction["maximumPostSyncError"] > .75
            or interaction["registrationScore"] < 89
            or interaction["successfulRegistrationChecks"] < 12
            or interaction["cardCoverageRatio"] < .45
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted full-stage ImageGen-textured DOM/GPU registration calibration with drag, range, layout, keyboard and reset controls while preserving subpixel plane lock and no automatic motion: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "prompt-select-replace-loop":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        document_state = page.evaluate("""() => ({
            shellState: document.querySelector('#prompt-shell').dataset.state,
            nativeSelection: getSelection().toString(),
            tokenValues: Object.fromEntries([...document.querySelectorAll('.semantic-span')].map(token => [token.dataset.field, token.textContent])),
            selectedTokens: document.querySelectorAll('.semantic-span.is-selected').length,
            appliedTokens: document.querySelectorAll('.semantic-span.is-applied').length,
            pressedOptions: document.querySelectorAll('.replacement-option[aria-pressed=\"true\"]').length,
            optionsDisabled: [...document.querySelectorAll('.replacement-option')].every(option => option.disabled),
            applyDisabled: document.querySelector('#apply-revision').disabled,
            undoDisabled: document.querySelector('#undo-revision').disabled,
            diffBefore: document.querySelector('#diff-before').textContent,
            diffAfter: document.querySelector('#diff-after').textContent,
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            scrollHeight: document.documentElement.scrollHeight,
            clientHeight: document.documentElement.clientHeight,
        })""")
        if (
            not assertion
            or interaction["id"] != "prompt-select-replace-loop"
            or interaction["task"] != "human-operated-semantic-prompt-span-revision-workspace"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "native-dom-range-selection-stages-one-semantic-replacement-and-explicit-apply-retains-the-revised-prompt"
            or interaction["assetStrategy"] != "code-native-editable-text-and-dom-range-no-functional-raster-input-required"
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStaticVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticLoop"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["selectedField"] != "region"
            or interaction["stagedValue"] != "Atlantic Portugal"
            or len(interaction["history"]) != 1
            or interaction["history"][0] != {"field": "region", "before": "Southern Europe", "after": "Atlantic Portugal"}
            or interaction["humanActions"] != 3
            or interaction["pointerSelectionCount"] != 1
            or interaction["keyboardSelectionCount"] != 0
            or interaction["optionSelectionCount"] != 1
            or interaction["applyCount"] != 1
            or interaction["undoCount"] != 0
            or interaction["resetCount"] != 0
            or interaction["nativeSelectionCount"] < 2
            or interaction["motionRuns"] < 4
            or interaction["renderCalls"] < 20
            or interaction["lastInputTrusted"] is not True
            or interaction["lastInputKind"] != "apply"
            or not interaction["ready"]
            or document_state["shellState"] != "applied"
            or document_state["nativeSelection"] != "Atlantic Portugal"
            or document_state["tokenValues"] != {"format": "weekly market brief", "region": "Atlantic Portugal", "focus": "rail-accessible coastal towns", "audience": "remote design teams"}
            or document_state["selectedTokens"] != 1
            or document_state["appliedTokens"] != 1
            or document_state["pressedOptions"] != 1
            or not document_state["optionsDisabled"]
            or not document_state["applyDisabled"]
            or document_state["undoDisabled"]
            or document_state["diffBefore"] != "Southern Europe"
            or document_state["diffAfter"] != "Atlantic Portugal"
            or document_state["scrollWidth"] > document_state["clientWidth"] + 1
            or document_state["scrollHeight"] > document_state["clientHeight"] + 1
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted native text selection, field-specific replacement, explicit retained Apply result and full-stage no-overflow prompt revision workflow without automatic motion: assertion={assertion!r}; interaction={interaction!r}; document={document_state!r}")
    elif demo["id"] == "self-inverting-fixed-navigation":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_STATE__()")
        evidence = interaction["sectionEvidence"]
        if (
            not assertion
            or interaction["id"] != "self-inverting-fixed-navigation"
            or interaction["task"] != "human-operated-long-form-reader-with-computed-background-contrast-navigation"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "paused-motion-track-seeks-only-from-trusted-human-input-while-fixed-navigation-selects-the-higher-wcag-contrast-ink-from-the-actual-section-background-underneath"
            or interaction["assetStrategy"] != "code-native-section-colors-and-computed-style-evidence-no-functional-raster-input-required"
            or interaction["acceptedInputs"] != ["trusted-wheel", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "visible-section-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["firstFrameStatic"]
            or not interaction["initialStaticVerified"]
            or interaction["automaticPlayback"]
            or interaction["automaticCycle"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["captureClockDriven"]
            or interaction["syntheticInputDispatch"]
            or interaction["trustedInteractionCount"] < 3
            or interaction["wheelCount"] != 0
            or interaction["keyboardCount"] < 1
            or interaction["sectionClickCount"] < 1
            or interaction["pointerDragCount"] != 1
            or interaction["pointerMoveCount"] < 5
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or interaction["lastInput"] != "keyboard:Home"
            or interaction["progress"] != 0
            or interaction["currentSection"] != 0
            or interaction["sampledSection"] != 0
            or interaction["activeBackground"] != "#071c22"
            or interaction["chosenInk"] != "LIGHT"
            or interaction["contrastRatio"] < 15
            or interaction["contrastRatio"] > 17
            or not interaction["contrastPass"]
            or interaction["sectionCount"] != 3
            or interaction["viewportHeight"] != 180
            or interaction["maximumOffset"] != 360
            or interaction["motionDuration"] != 1
            or not interaction["motionPaused"]
            or interaction["changedByTrustedInput"]
            or not interaction["everChangedByTrustedInput"]
            or interaction["evidenceSource"] != "computed-section-background"
            or len(evidence) != 3
            or [item["source"] for item in evidence] != ["#071c22", "#efe9d7", "#bd3f2b"]
            or [item["inkName"] for item in evidence] != ["LIGHT", "DARK", "LIGHT"]
            or not (15 <= evidence[0]["ratio"] <= 17)
            or not (13 <= evidence[1]["ratio"] <= 16)
            or not (4.6 <= evidence[2]["ratio"] <= 5.1)
            or interaction["computedBackgroundsMatch"] != [True, True, True]
            or interaction["controlStates"] != ["true", "false", "false"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted full-stage drag, chapter jump and keyboard return through three computed-background contrast states with a paused Motion track and no automatic navigation: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "infinite-curved-text-conveyor":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-routed-arena-wayfinding-ribbon-proof"
            or interaction["mechanism"] != "trusted-drag-seeks-two-paused-motion-controls-that-offset-repeated-svg-text-paths-in-opposing-directions"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["assetStrategy"] != "code-native-authored-svg-routes-and-editorial-type-no-functional-raster-input-required"
            or interaction["captureType"] != "interactive"
            or interaction["causality"] != "trusted-human-input-only"
            or interaction["acceptedInputs"] != ["captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "visible-direction-buttons", "keyboard-arrows-home-end-escape"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or interaction["automaticPath"]
            or interaction["automaticPlayback"]
            or interaction["automaticCycle"]
            or interaction["automaticTimeline"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["inputCount"] != interaction["trustedInputCount"]
            or interaction["inputCount"] < 8
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerDownCount"] != 1
            or interaction["pointerDragCount"] < 5
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["pointerCaptured"]
            or interaction["dragActive"]
            or interaction["activePointerId"] is not None
            or interaction["humanProgressMutationCount"] < 5
            or interaction["nonInputProgressMutationCount"] != 0
            or interaction["maximumHumanProgress"] < .5
            or interaction["mouseInputCount"] < 7
            or interaction["touchInputCount"] != 0
            or interaction["penInputCount"] != 0
            or interaction["buttonInputCount"] != 0
            or interaction["keyboardInputCount"] < 1
            or interaction["motionControlCount"] != 2
            or not interaction["controlsBuiltWithoutAutoplay"]
            or not interaction["motionControlsPaused"]
            or interaction["motionSeekCount"] < 10
            or interaction["motionSeekCount"] % 2 != 0
            or interaction["motionTimeSpread"] != 0
            or interaction["routePathCount"] != 2
            or interaction["repeatedCopyCountPerPath"] != 4
            or interaction["textPathCount"] != 8
            or any(record["trusted"] is not True for record in interaction["transitionRecords"])
            or interaction["progress"] != 0
            or interaction["phase"] != "key-home"
            or interaction["lastInputKind"] != "keyboard"
            or interaction["lastInputSource"] != "key-Home"
            or interaction["lastInputTrusted"] is not True
            or not interaction["ready"]
            or interaction["runtimeAssertCount"] < 2
            or not interaction["runtimeAssertionPassed"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted full-stage arena wayfinding ribbon calibration across two paused Motion-driven SVG text paths with captured drag, stable hold, keyboard reset and no automatic conveyor motion: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "staggered-multichart-telemetry-boot":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "operator-started-orbital-relay-telemetry-preflight"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "one-trusted-human-input-reveals-three-deterministic-charts-in-a-finite-stagger"
            or interaction["assetStrategy"] != "code-native-deterministic-telemetry-no-functional-raster-input-required"
            or interaction["captureType"] != "hybrid"
            or interaction["acceptedInputs"] != ["trusted-pointer-click", "trusted-keyboard-button-activation"]
            or interaction["causality"] != "trusted-run-button-starts-one-finite-staggered-diagnostic-pass"
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStaticVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticLoop"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["previewClockMutationBeforeInput"]
            or not interaction["previewClockDrivesFiniteTransitionAfterInput"]
            or interaction["phase"] != "complete"
            or interaction["progress"] != 1
            or interaction["stageProgress"] != [1, 1, 1]
            or interaction["activeStageIndex"] != 2
            or interaction["inputCount"] != 1
            or interaction["trustedInputCount"] != 1
            or interaction["pointerInputCount"] != 1
            or interaction["keyboardInputCount"] != 0
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["runStartCount"] != 1
            or interaction["runCompleteCount"] != 1
            or interaction["rerunCount"] != 0
            or interaction["stageActivationCount"] != 3
            or interaction["finiteTransitionStepCount"] < 18
            or interaction["reducedMotionDirectCount"] != 0
            or interaction["finalRecordId"] != "pass-07-nominal"
            or not interaction["resultValidated"]
            or interaction["lastInputKind"] != "pointer"
            or interaction["lastInputSource"] != "run-preflight-button"
            or interaction["lastInputTrusted"] is not True
            or interaction["dataSignature"] != "11616:3478:94"
            or not interaction["canvasSizeValidated"]
            or not interaction["geometryValidated"]
            or interaction["latestDrawSignature"] == "none"
            or interaction["drawCount"] < 18
            or interaction["renderCount"] < 30
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture one trusted full-stage operator-started p5 telemetry preflight with three finite staggered deterministic charts, a retained Nominal record and no automatic boot: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "poisson-constellation-bloom":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-pixel-derived-harbor-risk-relationship-graph"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "committed-image-pixels-classify-poisson-nodes-and-weight-local-risk-relations"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "range-control", "visible-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStaticConfirmed"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["timerMutationCount"] != 0
            or interaction["runtimeAssertCount"] < 2
            or interaction["inputCount"] < 16
            or interaction["humanInputCausalityCount"] != interaction["visualMutationCount"]
            or interaction["humanInputCausalityCount"] < interaction["inputCount"] - 4
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 9
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerReleaseCaptureCount"] != 1
            or interaction["hoverMutationCount"] < 1
            or interaction["dragMutationCount"] < 6
            or interaction["mouseDragMutationCount"] < 6
            or interaction["touchDragMutationCount"] != 0
            or interaction["penDragMutationCount"] != 0
            or interaction["keyboardInputCount"] != 3
            or interaction["rangeInputCount"] != 1
            or interaction["buttonActivationCount"] != 2
            or interaction["pinActivationCount"] != 2
            or interaction["resetCount"] != 1
            or interaction["dragDistance"] < 40
            or not interaction["queryActive"]
            or not interaction["queryPinned"]
            or interaction["selectedNodeIndex"] < 0
            or interaction["selectedCategory"] not in ("RUNOFF", "WATER", "UTILITY", "GROUND")
            or interaction["selectedRelationCount"] <= 0
            or interaction["selectedClusterChecksum"] <= 0
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["lastInputTrusted"] is not True
            or interaction["lastInputKind"] != "keyboard-Enter"
            or interaction["lastPointerType"] != "mouse"
            or interaction["sourceFetchCount"] != 1
            or interaction["sourceResponseStatus"] != 200
            or not interaction["sourceSameOrigin"]
            or interaction["sourceByteLength"] != 294954
            or interaction["sourceSha256"] != "cdd11f0c7486999bfeae82de1809f52762be6608fc9521b264f3a89732e638af"
            or not interaction["sourceShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or interaction["sourcePixelCount"] != 614400
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["sampledWidth"] != 80
            or interaction["sampledHeight"] != 45
            or interaction["sampledPixelCount"] != 3600
            or interaction["sampledByteLength"] != 14400
            or len(interaction["sampledPixelSha256"]) != 64
            or not interaction["sampledPixelSha256"].strip("0")
            or interaction["sampledPixelChecksum"] <= 0
            or interaction["distinctSampleColorCount"] <= 250
            or interaction["meanLuma"] <= .2
            or interaction["meanLuma"] >= .8
            or interaction["lumaDeviation"] <= .08
            or interaction["lumaDeviation"] >= .36
            or interaction["edgeDensity"] <= .05
            or interaction["edgeDensity"] >= .75
            or interaction["edgeSampleCount"] != 7075
            or interaction["warmPixelRatio"] <= .01
            or interaction["warmPixelRatio"] >= .3
            or interaction["darkPixelRatio"] <= .03
            or interaction["darkPixelRatio"] >= .7
            or interaction["poissonNodeCount"] < 50
            or interaction["poissonNodeCount"] > 100
            or interaction["minimumObservedNodeDistance"] < 19.99
            or interaction["relationshipCount"] < 150
            or interaction["relationshipCount"] > 350
            or interaction["crossRiskRelationshipCount"] < 5
            or interaction["crossRiskRelationshipCount"] > 50
            or interaction["highRiskNodeCount"] < 10
            or interaction["highRiskNodeCount"] > 60
            or len(interaction["categoryCounts"]) != 4
            or any(count <= 0 for count in interaction["categoryCounts"])
            or interaction["highestRiskNodeIndex"] < 0
            or interaction["highestRiskValue"] < .62
            or interaction["evidenceConclusion"] != "Runoff → utility"
            or interaction["graphChecksum"] <= 0
            or interaction["initialCanvasSignature"] <= 0
            or interaction["lastCanvasSignature"] <= 0
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["p5DrawCount"] < 12
            or interaction["renderCount"] < 36
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted reversible pixel-derived harbor-risk query, pinned relationship finding, and exact source-backed Poisson graph without automatic focus: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "svg-metaball-cursor-separation":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-material-recovery-batch-topology-separation"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "paused-motion-controls-seek-four-pixel-classified-svg-nodes-inside-feGaussianBlur-feColorMatrix-metaball-topology"
            or interaction["acceptedInputs"] != ["mouse-hover", "captured-mouse-drag", "captured-touch-drag", "captured-pen-drag", "keyboard", "visible-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStaticConfirmed"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or not interaction["renderIgnoresPreviewClock"]
            or not interaction["controlsBuiltWithoutAutoplay"]
            or interaction["runtimeAssertCount"] < 2
            or interaction["inputCount"] < 16
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["ignoredInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerMoveCount"] < 8
            or interaction["pointerDownCount"] != 1
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerReleaseCaptureCount"] != 1
            or interaction["hoverMutationCount"] < 1
            or interaction["dragMutationCount"] < 6
            or interaction["keyboardInputCount"] != 4
            or interaction["buttonActivationCount"] != 3
            or interaction["mergeActionCount"] != 1
            or interaction["separateActionCount"] != 1
            or interaction["lockActionCount"] != 3
            or interaction["resetCount"] != 1
            or interaction["humanInputCausalityCount"] < 14
            or interaction["separation"] != 1
            or interaction["maximumSeparation"] != 1
            or interaction["rotation"] != 0
            or not interaction["batchLocked"]
            or interaction["connectedComponentCount"] != 4
            or interaction["bridgeCount"] != 0
            or interaction["topologyState"] != "separated"
            or len(interaction["nodePositions"]) != 4
            or interaction["initialGeometryChecksum"] == interaction["currentGeometryChecksum"]
            or interaction["currentGeometryChecksum"] <= 0
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["dragging"]
            or interaction["lastInputKind"] != "keyboard-Enter"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 362959
            or interaction["assetSha256"] != "82e14d32428c48fea6267c9a954e8696965dc6ca73a8428554291ebd0f95ac39"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or interaction["sourcePixelWidth"] != 96
            or interaction["sourcePixelHeight"] != 64
            or interaction["sourcePixelCount"] != 6144
            or interaction["sourcePixelByteLength"] != 24576
            or len(interaction["sourcePixelSha256"]) != 64
            or not interaction["sourcePixelSha256"].strip("0")
            or interaction["distinctSampleColorCount"] <= 400
            or interaction["distinctSampleColorCount"] >= 6144
            or interaction["materialRegionSampleCount"] != 4
            or interaction["materialRegionPixelCount"] != 3128
            or interaction["materialIdentityCount"] != 4
            or set(interaction["materialClasses"]) != {"Cobalt glass", "Copper granulate", "Polymer flake", "Paper fibre"}
            or len(interaction["materialEvidence"]) != 4
            or any(evidence["pixelCount"] != 782 for evidence in interaction["materialEvidence"])
            or any(evidence["confidence"] < 75 or evidence["confidence"] > 99 for evidence in interaction["materialEvidence"])
            or interaction["materialEvidenceChecksum"] <= 0
            or not interaction["materialEvidenceReady"]
            or interaction["svgRootClass"] != "SVGSVGElement"
            or interaction["svgFilterElementCount"] < 1
            or interaction["gaussianBlurPrimitiveCount"] < 1
            or interaction["colorMatrixPrimitiveCount"] < 1
            or interaction["topologyNodeCount"] != 4
            or interaction["specimenNodeCount"] != 4
            or interaction["motionControlCount"] != 4
            or interaction["motionSeekCount"] < 40
            or interaction["motionTimeSpread"] != 0
            or not interaction["motionControlsPaused"]
            or interaction["previewClockCallCount"] < 36
            or interaction["previewClockIgnoredCount"] != interaction["previewClockCallCount"]
            or not interaction["runtimeAssertionPassed"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted reversible four-material separation, exact pixel identities, paused Motion control synchronization, and a locked SVG topology without automatic playback: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "kinetic-paper-fold-map":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-folded-fictional-harbor-walking-map"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "p5-canvas2d-four-panel-eight-affine-texture-triangle-fold"
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard", "visible-buttons"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or interaction["autoPlayback"]
            or interaction["rehearsal"]
            or interaction["fallback"]
            or interaction["syntheticInput"]
            or interaction["captureClockMutation"]
            or interaction["inputCount"] < 24
            or interaction["rejectedInputCount"] != 0
            or interaction["inputCounts"]["pointerdown"] != 1
            or interaction["inputCounts"]["pointermove"] < 9
            or interaction["inputCounts"]["pointerup"] != 1
            or interaction["inputCounts"]["mouse"] < 11
            or interaction["inputCounts"]["touch"] != 0
            or interaction["inputCounts"]["pen"] != 0
            or interaction["inputCounts"]["keyboard"] != 7
            or interaction["inputCounts"]["button"] != 6
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerReleaseCount"] != 1
            or interaction["visualMutationCount"] < 22
            or interaction["geometryMutationCount"] < 16
            or interaction["destinationMutationCount"] < 6
            or interaction["geometryMutationCount"] + interaction["destinationMutationCount"] != interaction["visualMutationCount"]
            or interaction["fold"] != 0
            or interaction["destination"] != 0
            or interaction["dragging"]
            or interaction["pointerId"] is not None
            or interaction["pointerType"] != "mouse"
            or interaction["firstInput"]["kind"] != "pointerdown"
            or interaction["firstInput"]["trusted"] is not True
            or interaction["lastInput"]["kind"] != "keydown-destination-1"
            or interaction["lastInput"]["trusted"] is not True
            or interaction["initialStill"]["fold"] != 0
            or interaction["initialStill"]["destination"] != 0
            or interaction["initialStill"]["inputCount"] != 0
            or not interaction["asset"]["requested"]
            or not interaction["asset"]["decoded"]
            or not interaction["asset"]["sameOrigin"]
            or interaction["asset"]["bytes"] != 267598
            or interaction["asset"]["sha256"] != "21b5265a21ba86ce963df14d267875320c0d723d16761c3c5be37c36e4fbdafd"
            or interaction["asset"]["width"] != 960
            or interaction["asset"]["height"] != 540
            or interaction["asset"]["pixelCount"] != 518400
            or interaction["asset"]["rgbaBytes"] != 2073600
            or interaction["asset"]["pixelFingerprint"] <= 0
            or len(interaction["asset"]["samples"]) != 4
            or len({tuple(sample[:3]) for sample in interaction["asset"]["samples"]}) != 4
            or interaction["geometry"]["faceCount"] != 4
            or interaction["geometry"]["triangleCount"] != 8
            or interaction["geometry"]["sourceCoverage"] != 960
            or not interaction["geometry"]["continuous"]
            or interaction["geometry"]["maxSeamError"] >= 1e-6
            or interaction["geometry"]["projectedWidth"] != interaction["geometry"]["flatWidth"]
            or abs(interaction["geometry"]["foldAngle"]) >= 1e-6
            or interaction["geometry"]["selectedPanel"] != 3
            or interaction["geometry"]["selectedPanel"] != interaction["geometry"]["expectedSelectedPanel"]
            or interaction["geometry"]["landmarkPanels"] != interaction["geometry"]["expectedLandmarkPanels"]
            or not interaction["geometry"]["landmarkPointsVisible"]
            or not interaction["geometry"]["selectedPointVisible"]
            or not interaction["geometry"]["routeOriginVisible"]
            or interaction["geometry"]["canvasWidth"] != 320
            or interaction["geometry"]["canvasHeight"] != 180
            or interaction["renderCount"] < 20
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted captured fold, destination controls, keyboard reversibility, four continuous textured faces, eight affine triangles, and registered landmarks over the verified local map: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "cursor-heatmap-crystallization":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-pixel-derived-thermal-crystallization-material-test"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["mechanism"] != "real-micrograph-pixels-derive-material-zones-diffusion-properties-and-crystallization-thresholds"
            or interaction["acceptedInputs"] != ["mouse-hover", "mouse-drag", "touch-drag", "pen-drag", "keyboard", "button-control"]
            or not interaction["userInputRequired"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStaticConfirmed"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["inputCount"] < 28
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 17
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerReleaseCaptureCount"] != 1
            or interaction["keyboardInputCount"] != 3
            or interaction["buttonActivationCount"] != 5
            or interaction["heatApplicationCount"] < 22
            or interaction["coolingActionCount"] != 2
            or interaction["resetActionCount"] != 1
            or interaction["humanInputCausalityCount"] != interaction["heatApplicationCount"] + interaction["coolingActionCount"] + interaction["resetActionCount"]
            or interaction["diffusionIterationCount"] < 150
            or interaction["settleIterationCount"] != 8
            or interaction["recoveryIterationCount"] != 68
            or interaction["heatedCellMutationCount"] < 1000
            or interaction["crystallizationMutationCount"] < 1000
            or interaction["recoveryMutationCount"] < 500
            or interaction["thresholdCrossingCount"] < 40
            or interaction["probeMoveCount"] < 18
            or interaction["maxSourcePathPointCount"] < 15
            or interaction["maximumPeakKelvin"] < 800
            or interaction["maximumCrystallizedCellCount"] < 40
            or interaction["currentPeakKelvin"] != 293
            or interaction["crystallizedCellCount"] != 0
            or interaction["sourcePathPointCount"] != 0
            or not interaction["stableAfterInput"]
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["lastInputKind"] not in ("button-reset", "mouse-reset")
            or interaction["lastInputTrusted"] is not True
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 456215
            or interaction["assetSha256"] != "52cc25a66d3f7b4bf699b3cf5b3f8ae3d50311d51638f190852a3d6c6aa1cd4f"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["sampledWidth"] != 80
            or interaction["sampledHeight"] != 45
            or interaction["sampledPixelCount"] != 3600
            or interaction["sampledByteLength"] != 14400
            or len(interaction["sourcePixelSha256"]) != 64
            or interaction["distinctSampleColorCount"] <= 1000
            or interaction["materialCellCount"] != 3600
            or interaction["ceramicCellCount"] + interaction["conductorCellCount"] + interaction["poreCellCount"] != 3600
            or not 2200 < interaction["ceramicCellCount"] < 2600
            or not 250 < interaction["conductorCellCount"] < 500
            or not 700 < interaction["poreCellCount"] < 950
            or interaction["maximumConductivity"] <= interaction["minimumConductivity"] * 3
            or interaction["maximumHeatCapacity"] <= interaction["minimumHeatCapacity"]
            or interaction["maximumCrystallizationThreshold"] <= interaction["minimumCrystallizationThreshold"]
            or interaction["materialPropertyChecksum"] <= 0
            or not interaction["assetEvidenceReady"]
            or not interaction["materialEvidenceReady"]
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CompletedDrawCount"] < 15
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted hover, a captured heat trace, keyboard pulse, explicit pulse/cool/reset, finite pixel-derived thermal diffusion, crystallization and recovery over the verified local p5 material plate: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "iris-aperture-navigation":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-portfolio-chapter-navigation"
            or interaction["mechanism"] != "p5-canvas-local-raster-circular-clip-and-twelve-blade-iris"
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard", "button"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or interaction["automaticPath"]
            or interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["rehearsalMode"]
            or interaction["previewClockDriven"]
            or interaction["previewClockMutation"]
            or interaction["visualMutationFromPreviewClock"]
            or interaction["syntheticInputDispatch"]
            or not interaction["initialStillVerified"]
            or interaction["inputCount"] < 25
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedCount"] != 0
            or interaction["hoverInputCount"] < 6
            or interaction["mouseInputCount"] < 8
            or interaction["touchInputCount"] != 0
            or interaction["penInputCount"] != 0
            or interaction["keyboardInputCount"] != 6
            or interaction["buttonInputCount"] != 5
            or interaction["pointerDownCount"] != 1
            or interaction["pointerDragCount"] < 6
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["geometryMutationCount"] < 20
            or interaction["humanGeometryMutationCount"] != interaction["geometryMutationCount"]
            or interaction["nonInputGeometryMutationCount"] != 0
            or interaction["centerMutationCount"] < 10
            or interaction["openMutationCount"] < 8
            or interaction["selectionMutationCount"] < 5
            or abs(interaction["open"] - .9) > .001
            or interaction["selectedChapter"] != 1
            or abs(interaction["center"]["x"] - .54) > .001
            or abs(interaction["center"]["y"] - .5) > .001
            or interaction["activePointerId"] is not None
            or interaction["activePointerType"] != "none"
            or interaction["pointerCaptured"]
            or interaction["lastInputKind"] != "keyboard"
            or interaction["lastInputTrusted"] is not True
            or interaction["assetFetchCount"] != 1
            or interaction["assetFetchStatus"] != 200
            or "image/jpeg" not in interaction["assetMimeType"]
            or interaction["assetByteLength"] != 206995
            or interaction["assetSha256"] != "4aa3eb7fb702d03313d32413186d58e21ac3bc480711042c2dd1224ee36b6618"
            or not interaction["assetChecksumVerified"]
            or not interaction["assetDecoded"]
            or interaction["assetNaturalWidth"] != 960
            or interaction["assetNaturalHeight"] != 640
            or not interaction["p5ImageCreated"]
            or interaction["p5ImagePixelCount"] != 614400
            or interaction["p5ImagePixelByteLength"] != 2457600
            or interaction["sourcePixelChecksum"] <= 0
            or interaction["p5ImageDrawCalls"] < 20
            or interaction["lastDrawnAssetSha256"] != "4aa3eb7fb702d03313d32413186d58e21ac3bc480711042c2dd1224ee36b6618"
            or interaction["bladeCount"] != 12
            or interaction["bladeVertexCount"] != 48
            or interaction["apertureClipCount"] < 10
            or interaction["renderedSampleCount"] <= 1000
            or interaction["renderedLuminanceRange"] <= 80
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted hover, captured drag, chapter controls, keyboard aperture changes, twelve-blade geometry, and a verified local p5 destination image with zero automatic mutation: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "liquid-lens-card-refraction":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-fictional-vinyl-pressing-surface-inspection"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "same-local-photo-underlay-and-magnified-lens-sample-with-live-backdrop-filter"
            or interaction["assetMechanismRole"] != "local-raster-is-both-visible-underlay-and-the-lens-refraction-pixel-source"
            or interaction["acceptedInputs"] != ["mouse-hover", "mouse-drag", "touch-drag", "pen-drag", "keyboard", "button-control"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or not interaction["initialFrameStatic"]
            or not interaction["initialStillVerified"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or not interaction["renderIgnoresPreviewClock"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["nonInputVisualMutationCountAfterReady"] != 0
            or abs(interaction["x"] - .66) > .001
            or abs(interaction["y"] - .48) > .001
            or abs(interaction["zoom"] - 1.48) > .001
            or interaction["inputCount"] < 22
            or interaction["trustedInputCount"] != interaction["inputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 12
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["keyboardInputCount"] != 5
            or interaction["buttonActivationCount"] != 5
            or interaction["hoverMutationCount"] < 5
            or interaction["dragMutationCount"] < 6
            or interaction["keyboardMutationCount"] != 5
            or interaction["buttonMutationCount"] != 5
            or interaction["lensPositionMutationCount"] < 15
            or interaction["zoomMutationCount"] < 7
            or interaction["humanVisualMutationCount"] < 21
            or interaction["humanInputCausalityCount"] != interaction["humanVisualMutationCount"]
            or interaction["activePointerId"] is not None
            or interaction["activePointerType"] != "none"
            or interaction["pointerCaptured"]
            or interaction["lastInputKind"] != "button"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["firstHumanStateBefore"] == interaction["firstHumanStateAfter"]
            or interaction["maximumPositionDelta"] <= .15
            or interaction["minimumHumanZoom"] > 1.48
            or interaction["maximumHumanZoom"] < 1.72
            or interaction["lensSampleMappingCount"] < interaction["humanVisualMutationCount"] + 1
            or interaction["stageWidth"] != 320
            or interaction["stageHeight"] != 180
            or interaction["stageCoverageRatio"] <= .98
            or interaction["photoCoverageRatio"] <= .98
            or interaction["lensWidth"] < 33
            or abs(interaction["lensWidth"] - interaction["lensHeight"]) >= 1
            or "blur(" not in interaction["computedBackdropFilter"]
            or "saturate(" not in interaction["computedBackdropFilter"]
            or interaction["computedLensBackgroundImage"] == "none"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or "image/jpeg" not in interaction["assetMimeType"]
            or interaction["assetByteLength"] != 301656
            or interaction["assetSha256"] != "cd293bfc9c71a8c97b1ad98a3fec14a5afd9676add17806dafa5c79312fbeaeb"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or interaction["domImageDecodedCount"] != 1
            or interaction["sampledPixelCount"] != 1536
            or interaction["sampledPixelByteLength"] != 6144
            or len(interaction["sourcePixelChecksum"]) != 8
            or interaction["distinctSampleColorCount"] <= 180
            or interaction["sampledLumaRange"] <= 150
            or interaction["alphaFailureCount"] != 0
            or interaction["motionControllerCount"] != 1
            or interaction["motionControllerDuration"] != 1
            or not interaction["motionControllerPaused"]
            or abs(interaction["motionControllerZoom"] - interaction["zoom"]) >= .001
            or interaction["motionControllerSeekCount"] < 7
            or interaction["motionControllerUpdateCount"] < 7
            or interaction["previewRenderCount"] < 36
            or not interaction["assetEvidenceReady"]
            or not interaction["ready"]
            or not interaction["runtimeAssertionPassed"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted hover, captured drag, keyboard and optical controls over one verified full-stage pressing photograph, a human-sought paused Motion zoom controller, and zero automatic mutation: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "orbital-card-constellation":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        expected_asset_shas = [
            "08c0aef77854afa481b5274c6907f4f8f8bd867fcabd5843388b51c1aa31a699",
            "a228f2ea088572a0df3d6cc5f0fcdddf3a5dd86251035285d22d2b49e19a7f5a",
            "fdd6161ac7f4cce819c2d67a6e9b7d481ff271030cd44a26f57a9c3e07960532",
        ]
        if (
            not assertion
            or interaction["task"] != "human-directed-project-evidence-relationship-board"
            or interaction["mechanism"] != "pointer-owned-gravity-center-with-static-elliptical-orbit-topology"
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard", "control"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or interaction["automaticOrbit"]
            or interaction["automaticPlayback"]
            or interaction["automaticCruise"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["previewClockDriven"]
            or interaction["previewClockMutation"]
            or interaction["syntheticInputDispatch"]
            or not interaction["renderIgnoresPreviewClock"]
            or not interaction["firstFrameStatic"]
            or not interaction["initialStaticVerified"]
            or interaction["layoutMode"] != "gathered"
            or interaction["initialLayoutMode"] != "expanded"
            or interaction["selectedNodeIndex"] != 2
            or interaction["selectedNodeId"] != "eelgrass-array"
            or interaction["inputCount"] != 19
            or interaction["trustedInputCount"] != 19
            or interaction["rejectedUntrustedCount"] != 0
            or interaction["pointerInputCount"] != 10
            or interaction["mouseInputCount"] != 10
            or interaction["touchInputCount"] != 0
            or interaction["penInputCount"] != 0
            or interaction["keyboardInputCount"] != 7
            or interaction["controlInputCount"] != 2
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] != 8
            or interaction["pointerReleaseInputCount"] != 1
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or interaction["activePointerType"] != "none"
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerReleaseCaptureCount"] != 1
            or interaction["dragUpdateCount"] != 8
            or interaction["relationMutationCount"] != 17
            or interaction["gravityMutationCount"] != 10
            or interaction["orbitMutationCount"] != 10
            or interaction["modeMutationCount"] != 3
            or interaction["selectionMutationCount"] != 2
            or interaction["resetCount"] != 0
            or interaction["lastInputKind"] != "keyboard"
            or interaction["lastInputCause"] != "keyboard-enter"
            or interaction["lastInputTrusted"] is not True
            or len(interaction["inputLedger"]) != 17
            or interaction["assetCount"] != 3
            or interaction["sameOriginFetchCount"] != 3
            or interaction["assetFetchFailureCount"] != 0
            or interaction["assetDecodeCount"] != 3
            or interaction["assetDecodeFailureCount"] != 0
            or interaction["assetShaMatchCount"] != 3
            or interaction["assetSha256"] != expected_asset_shas
            or interaction["distinctAssetShaCount"] != 3
            or len(interaction["assetPixelChecksums"]) != 3
            or interaction["distinctPixelChecksumCount"] != 3
            or interaction["sampledPixelCount"] != 4608
            or interaction["sampledChannelCount"] != 18432
            or interaction["assetInfluenceCount"] < 2
            or not interaction["assetEvidenceReady"]
            or len(interaction["assetEvidence"]) != 3
            or interaction["p5ImageCount"] != 3
            or interaction["p5ImagePixelTransferCount"] != 115200
            or interaction["p5ImageDrawCount"] < 45
            or not interaction["p5Ready"]
            or not interaction["canvasReady"]
            or interaction["nodeCount"] != 5
            or interaction["evidenceNodeCount"] != 3
            or interaction["taskNodeCount"] != 2
            or interaction["topologyEdgeCount"] != 12
            or len(set(interaction["topologyEdgePairs"])) != 12
            or len(interaction["nodePositions"]) != 5
            or len(interaction["edgeLengths"]) != 12
            or not interaction["topologyGeometryValid"]
            or interaction["maxEllipseResidual"] >= .00001
            or interaction["minHubDistance"] <= 0
            or interaction["drawCount"] < 20
            or interaction["redrawRequestCount"] < 19
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted project-center drag, gathered/expanded topology decisions, evidence selection, three ImageGen-derived p5 nodes, five named nodes, twelve unique edges, and zero automatic orbit: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "peelable-paper-corner-reveal":
        page.wait_for_function(
            "window.__PREVIEW_INTERACTION_STATE__.phase === 'revealed' && window.__PREVIEW_INTERACTION_STATE__.progress === 1",
            timeout=2_000,
        )
        assertion = page.evaluate("async () => await window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-fictional-ticket-corner-peel-and-code-reveal"
            or interaction["claimedLibrary"] != "motion@12.42.2"
            or interaction["mechanism"] != "pointer-distance-seeks-motion-controller-that-drives-paper-clip-and-fold-geometry"
            or interaction["acceptedInputs"] != ["mouse-drag", "touch-drag", "pen-drag", "keyboard", "button-control"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or not interaction["renderIgnoresPreviewClock"]
            or not interaction["userInputRequired"]
            or not interaction["initialFrameStatic"]
            or interaction["initialProgress"] != 0
            or interaction["progress"] != 1
            or interaction["phase"] != "revealed"
            or interaction["inputCount"] < 25
            or interaction["pointerDownCount"] != 3
            or interaction["pointerMoveCount"] < 14
            or interaction["pointerReleaseCount"] != 3
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 3
            or interaction["pointerReleaseCaptureCount"] != 3
            or interaction["keyboardInputCount"] != 4
            or interaction["buttonActivationCount"] != 2
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["humanProgressMutationCount"] < 35
            or interaction["directDragMutationCount"] < 14
            or interaction["inputOwnedAnimationCount"] < 4
            or interaction["inputOwnedAnimationFrameCount"] < 20
            or interaction["completedRevealCount"] < 3
            or interaction["cancelledRevealCount"] < 3
            or interaction["heldMidpointCount"] < 1
            or interaction["lastInputKind"] != "button-control"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["maxHumanProgress"] != 1
            or interaction["minHumanProgress"] != 0
            or interaction["maxDragDistance"] < .6
            or interaction["firstHumanProgressBefore"] != 0
            or interaction["firstHumanProgressAfter"] <= 0
            or interaction["lastSettledOutcome"] != "completed"
            or interaction["geometrySeekCount"] < 40
            or abs(interaction["peelXPercent"] - 78) > .001
            or abs(interaction["peelYPercent"] - 96) > .001
            or abs(interaction["foldXPercent"] - 46) > .001
            or abs(interaction["foldYPercent"] - 57) > .001
            or abs(interaction["foldLiftDegrees"] - 8) > .001
            or abs(interaction["revealedTriangleAreaRatio"] - .3744) > .0001
            or interaction["clipPointCount"] != 5
            or interaction["motionControllerCount"] != 1
            or interaction["motionControllerDuration"] != 1
            or not interaction["motionControllerPaused"]
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 285540
            or interaction["assetSha256"] != "6ff542786473f5fd4652b22a934ffedcbed46de13ef1736b8e8195f5c6b61abe"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or interaction["domImageDecodedCount"] != 2
            or interaction["assetPixelSampleCount"] != 1536
            or interaction["assetPixelByteLength"] != 6144
            or len(interaction["assetPixelChecksum"]) != 8
            or interaction["distinctSampleColorCount"] <= 80
            or interaction["sampledLumaRange"] <= 140
            or interaction["stageCoverageRatio"] <= .66
            or interaction["ticketAspectRatio"] <= 1.75
            or interaction["renderCallCount"] < 36
            or not interaction["assetEvidenceReady"]
            or not interaction["ready"]
            or not interaction["runtimeAssertionPassed"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted cancelled, held, completed, keyboard, and button ticket-peel paths with verified dual-use artwork and zero automatic or preview-clock mutation: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "pixel-sort-hover-wipe":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-real-photo-column-pixel-sort-inspection"
            or interaction["mechanism"] != "real-photo-pixels-sorted-within-every-column-by-luma-or-hue"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["acceptedInputs"] != ["mouse-hover", "mouse-drag", "touch-drag", "pen-drag", "keyboard", "button-control"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["captureClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or not interaction["renderIgnoresPreviewClock"]
            or not interaction["userInputRequired"]
            or not interaction["initialFrameStatic"]
            or interaction["initialBoundary"] != 0
            or interaction["boundary"] != 1
            or interaction["mode"] != "hue"
            or interaction["inputCount"] < 35
            or interaction["pointerEnterCount"] < 1
            or interaction["pointerDownCount"] != 2
            or interaction["pointerMoveCount"] < 18
            or interaction["pointerReleaseCount"] != 2
            or interaction["pointerCaptureCount"] != 2
            or interaction["pointerReleaseCaptureCount"] != 2
            or interaction["keyboardInputCount"] < 9
            or interaction["buttonActivationCount"] < 3
            or interaction["boundaryMutationCount"] < 25
            or interaction["modeMutationCount"] < 5
            or interaction["humanInputCausalityCount"] != interaction["boundaryMutationCount"] + interaction["modeMutationCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["minHumanBoundary"] != 0
            or interaction["maxHumanBoundary"] != 1
            or interaction["maxBoundaryDelta"] < .8
            or interaction["firstHumanInputBoundaryBefore"] != 0
            or interaction["firstHumanInputBoundaryAfter"] <= 0
            or interaction["lastInputKind"] != "mouse-hue"
            or interaction["lastInputTrusted"] is not True
            or interaction["lastPointerType"] != "mouse"
            or interaction["assetFetchCount"] != 1
            or interaction["assetResponseStatus"] != 200
            or not interaction["assetSameOrigin"]
            or interaction["assetByteLength"] != 158215
            or interaction["assetSha256"] != "91c7edd0dbb343180c435606415ab32ecd39b4a501b8ee6e678ba4b14f351003"
            or not interaction["assetShaMatchesExpected"]
            or not interaction["browserImageDecoded"]
            or interaction["sourceNaturalWidth"] != 960
            or interaction["sourceNaturalHeight"] != 640
            or not interaction["p5ImageDecoded"]
            or interaction["p5ImageClass"] != "p5.Image"
            or interaction["p5ImageWidth"] != 960
            or interaction["p5ImageHeight"] != 640
            or interaction["p5ImagePixelLength"] != 2457600
            or interaction["sampledWidth"] != 480
            or interaction["sampledHeight"] != 270
            or interaction["sampledPixelCount"] != 129600
            or interaction["sampledByteLength"] != 518400
            or len(interaction["sourcePixelSha256"]) != 64
            or any(character not in "0123456789abcdef" for character in interaction["sourcePixelSha256"])
            or interaction["distinctSampleColorCount"] <= 160
            or interaction["sourceAlphaFailureCount"] != 0
            or interaction["lumaSortedColumnCount"] != 480
            or interaction["hueSortedColumnCount"] != 480
            or interaction["sortedPixelWriteCount"] != 259200
            or interaction["lumaMonotonicViolationCount"] != 0
            or interaction["hueMonotonicViolationCount"] != 0
            or interaction["lumaDifferencePixelCount"] <= interaction["sampledPixelCount"] * .95
            or interaction["hueDifferencePixelCount"] <= interaction["sampledPixelCount"] * .95
            or not interaction["p5InstanceReady"]
            or not interaction["p5CanvasReady"]
            or interaction["p5CanvasWidth"] != 320
            or interaction["p5CanvasHeight"] != 180
            or interaction["renderCount"] < 30
            or interaction["p5DrawCount"] < 15
            or interaction["sortedColumnsRendered"] != 480
            or interaction["maxSortedColumnsRendered"] != 480
            or interaction["sortedPixelsRendered"] != 129600
            or interaction["renderPixelSource"] != "hue-sorted-real-photo-buffer"
            or not interaction["assetEvidenceReady"]
            or not interaction["sortEvidenceReady"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted hover, two opposed captured drags, keyboard endpoints, two real luma/hue 480-column pixel buffers, exact local ImageGen asset identity, and zero automatic or preview-clock mutation: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "accordion-image-slices":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-exhibition-accordion-proof"
            or interaction["mechanism"] != "p5-canvas-nine-slice-local-raster-accordion"
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard"]
            or not interaction["userInputRequired"]
            or not interaction["strictTrustedInputGuard"]
            or interaction["automaticPath"]
            or interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["previewClockDriven"]
            or interaction["previewClockMutation"]
            or interaction["syntheticInputDispatch"]
            or interaction["sliceCount"] != 9
            or interaction["initialOpen"] != .38
            or interaction["open"] != 1
            or not interaction["initialStillVerified"]
            or not interaction["ready"]
            or not interaction["listenersBound"]
            or interaction["activePointerId"] is not None
            or interaction["activePointerType"] != "none"
            or interaction["pointerCaptured"]
            or interaction["inputCount"] < 30
            or interaction["inputCount"] != interaction["trustedInputCount"]
            or interaction["rejectedUntrustedCount"] != 0
            or interaction["pointerDownCount"] != 2
            or interaction["pointerMoveCount"] < 16
            or interaction["pointerReleaseCount"] != 2
            or interaction["pointerCancelCount"] != 0
            or interaction["pointerCaptureCount"] != 2
            or interaction["pointerCaptureReleaseCount"] != 2
            or interaction["keyboardInputCount"] < 10
            or interaction["openMutationCount"] < 25
            or interaction["humanOpenMutationCount"] != interaction["openMutationCount"]
            or interaction["nonInputOpenMutationCount"] != 0
            or interaction["lastInputKind"] != "keyboard"
            or interaction["lastInputSource"] != "keyboard-End"
            or interaction["lastInputTrusted"] is not True
            or len(interaction["inputRecords"]) < 25
            or interaction["assetFetchCount"] != 1
            or interaction["assetFetchStatus"] != 200
            or "image/jpeg" not in interaction["assetMimeType"]
            or interaction["assetByteLength"] != 161328
            or not interaction["assetDecoded"]
            or interaction["assetDecodeCount"] != 1
            or interaction["assetNaturalWidth"] != 960
            or interaction["assetNaturalHeight"] != 640
            or interaction["assetSha256"] != "220ad04c64ee1b8d8266e62aa93c16819406d7082956595f4fce6fffb34be0b5"
            or not interaction["assetChecksumVerified"]
            or interaction["sampledPixelCount"] != 6144
            or interaction["sourcePixelChecksum"] <= 0
            or not interaction["p5CanvasCreated"]
            or interaction["p5DrawCount"] < 20
            or interaction["imageDrawCalls"] < 180
            or interaction["lastDrawnAssetSha256"] != interaction["assetSha256"]
            or interaction["renderedSampleCount"] <= 1000
            or interaction["renderedPixelChecksum"] <= 0
            or interaction["renderedLuminanceRange"] <= 80
            or interaction["previewRenderCalls"] < 30
            or interaction["layout"]["width"] != 320
            or interaction["layout"]["height"] != 180
        ):
            raise RuntimeError(f"{demo['id']} did not capture two opposed trusted accordion drags, exact keyboard endpoints, nine continuous image-sampled folds, verified local ImageGen pixels, pointer capture accounting, and zero automatic or preview-clock mutation: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "curved-3d-text-orbit":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-music-release-curved-type-lockup-review"
            or interaction["acceptedInputs"] != ["wheel", "mouse", "touch", "pen", "keyboard", "control"]
            or not interaction["userInputRequired"]
            or not interaction["trustedInputOnly"]
            or interaction["automaticPlayback"]
            or interaction["automaticCruise"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["previewClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["syntheticInputDispatch"]
            or interaction["finiteInputInertiaOnly"]
            or interaction["inertiaEnabled"]
            or not interaction["firstFrameStatic"]
            or not interaction["initialStaticVerified"]
            or interaction["mode"] != "order-checked"
            or interaction["dragging"]
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or interaction["activePointerType"] is not None
            or interaction["pointerCaptureCount"] != 2
            or interaction["pointerReleaseCount"] != 2
            or interaction["pointerCancelCount"] != 0
            or interaction["dragMoveCount"] < 8
            or interaction["inputCount"] < 25
            or interaction["inputCount"] != interaction["trustedInputCount"]
            or interaction["rejectedUntrustedCount"] != 0
            or interaction["pointerInputCount"] < 20
            or interaction["wheelInputCount"] != 1
            or interaction["keyboardInputCount"] < 5
            or interaction["controlInputCount"] < 6
            or interaction["rotationMutationCount"] < 10
            or interaction["depthMutationCount"] < 5
            or interaction["inspectionCount"] != 2
            or interaction["resetCount"] != 1
            or interaction["positiveInputCount"] < 3
            or interaction["negativeInputCount"] < 3
            or interaction["reversalCount"] < 3
            or interaction["lastInputType"] != "keyboard"
            or interaction["lastInputTrusted"] is not True
            or interaction["phrase"] != "AURAL FORMS · LIVE SESSION 04 ·"
            or interaction["phraseGlyphCount"] != 31
            or interaction["projectedGlyphCount"] != 31
            or not interaction["glyphOrderIntegrity"]
            or interaction["backGlyphCount"] <= 0
            or interaction["frontGlyphCount"] <= 0
            or interaction["backGlyphCount"] + interaction["frontGlyphCount"] != 31
            or interaction["frontGlyphIndex"] != 0
            or interaction["frontGlyphCharacter"] != "A"
            or interaction["artworkSourceKind"] != "project-local-imagegen-asset"
            or interaction["artworkByteLength"] != 217189
            or interaction["artworkSha256"] != "f34450cfd9f5215367008aea71c719dde3c1d6df848f85c3e4e86203c1e08c1c"
            or interaction["artworkWidth"] != 960
            or interaction["artworkHeight"] != 960
            or not interaction["artworkDecoded"]
            or not interaction["artworkDimensionsValid"]
            or interaction["artworkSampledPixelCount"] != 1600
            or len(interaction["artworkSampleChecksum"]) != 8
            or not interaction["artworkPaletteDistinct"]
            or not interaction["paletteDrivenInterface"]
            or interaction["artworkDrawCount"] < 2
            or not interaction["p5Ready"]
            or not interaction["canvas2dReady"]
            or interaction["drawCount"] < 10
            or interaction["previewRenderCount"] < 30
            or len(interaction["ledger"]) < 20
        ):
            raise RuntimeError(f"{demo['id']} did not capture two opposed trusted drags, wheel/keyboard/depth controls, order inspection/reset, all 31 depth-sorted source glyphs, and a verified local ImageGen artwork without automatic, inertial, synthetic, or capture-clock motion: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "slider-controlled-exploded-3d-assembly":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "inspect-fictional-field-beacon-exploded-assembly-by-human-input"
            or interaction["acceptedInputs"] != ["range", "mouse", "touch", "pen", "keyboard", "part-control", "reset-control"]
            or interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["automaticRehearsal"]
            or interaction["previewClockDriven"]
            or interaction["previewClockMutations"] != 0
            or interaction["syntheticDispatch"]
            or interaction["inputPolicy"] != "trusted-only"
            or interaction["capturePolicy"] != "horizontal-pointer-capture"
            or interaction["renderer"] != "p5-webgl"
            or not interaction["userInputRequired"]
            or not interaction["initialStaticVerified"]
            or interaction["progress"] != 0
            or interaction["selectedPartId"] is not None
            or interaction["inspectionMode"] != "assembled"
            or interaction["activePointerId"] is not None
            or interaction["pointerCaptured"]
            or interaction["trustedInputCount"] < 18
            or interaction["rejectedSyntheticInputCount"] != 0
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 6
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureVerifiedCount"] != 1
            or interaction["rangeInputCount"] != 3
            or interaction["keyboardInputCount"] != 4
            or interaction["partControlCount"] != 1
            or interaction["resetControlCount"] != 2
            or interaction["progressMutationCount"] < 16
            or interaction["intermediateStopCount"] < 1
            or interaction["endpointStartVisits"] < 4
            or interaction["endpointEndVisits"] < 3
            or not interaction["endpointMappingVerified"]
            or not interaction["resetSnapshotVerified"]
            or interaction["lastInputTrusted"] is not True
            or interaction["lastInputType"] != "reset-control"
            or interaction["semanticPartCount"] != 7
            or interaction["partIdentitySequence"] != ["front-guard", "sealed-lens", "optical-reflector", "emitter-plate", "heat-sink", "power-shell", "service-latch"]
            or interaction["partOrders"] != [1, 2, 3, 4, 5, 6, 7]
            or interaction["assemblyAxes"] != ["X−", "X−", "X−", "X−", "X+", "X+", "X+"]
            or not interaction["assemblyOrderVerified"]
            or not interaction["positionOrderVerified"]
            or interaction["lastPartPositions"] != [-64, -55, -42, -27, -10, 25, 52]
            or interaction["assetSourceKind"] != "project-local-imagegen-material"
            or interaction["assetFetchCount"] != 1
            or not interaction["assetSameOrigin"]
            or not interaction["assetResponseSameOrigin"]
            or not interaction["assetDecoded"]
            or interaction["assetWidth"] != 640
            or interaction["assetHeight"] != 640
            or interaction["assetByteLength"] != 178411
            or interaction["assetSha256"] != "f1ef3b959a2f2e0d73ff718db8a4da5ffc560adb185751f3e9c241df9b992e5a"
            or interaction["assetExpectedSha256"] != interaction["assetSha256"]
            or interaction["assetSamplePixelCount"] != 16384
            or interaction["assetSampleChecksum"] <= 0
            or interaction["assetDistinctLuminanceBuckets"] < 5
            or interaction["assetChromaSamples"] <= 100
            or not interaction["p5TextureReady"]
            or interaction["p5TexturePixelCount"] != 16384
            or interaction["p5TextureChecksum"] != interaction["assetSampleChecksum"]
            or interaction["textureApplyCount"] < 30
            or set(interaction["texturedPartIds"]) != {"power-shell", "service-latch"}
            or interaction["webglRenderCount"] < 15
            or not interaction["listenersBound"]
            or not interaction["ready"]
        ):
            raise RuntimeError(f"{demo['id']} did not capture a trusted intermediate scrub, semantic part inspection, real range and keyboard endpoints, exact reset, seven ordered WebGL parts, and verified ImageGen p5 texture use without automation: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "collision-reactive-3d-physics-stack":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-triggered-parcel-impact-calibration"
            or interaction["mechanism"] != "p5-webgl-fixed-step-aabb-rigid-body-collision-impulses"
            or interaction["inputPolicy"] != "trusted-only"
            or interaction["previewClockDriven"]
            or interaction["autoplay"]
            or interaction["autoStartAttempted"]
            or interaction["rehearsalMode"]
            or interaction["fallbackUsed"]
            or interaction["syntheticInputUsed"]
            or not interaction["firstFrameWasPaused"]
            or interaction["initialFramePhysicsSteps"] != 0
            or interaction["selectedPayload"] != "fragile"
            or not interaction["simulationStartedByTrustedInput"]
            or interaction["simulationActionCount"] < 5
            or interaction["resetCount"] != 1
            or interaction["dropCount"] < 3
            or interaction["sideImpactCount"] < 2
            or interaction["selectionCount"] < 3
            or interaction["trustedInputCount"] < 11
            or interaction["rejectedUntrustedCount"] != 0
            or interaction["pointerInputCount"] < 7
            or interaction["keyboardInputCount"] < 4
            or interaction["controlInputCount"] != 0
            or interaction["aimMutationCount"] < 2
            or interaction["lastInputTrusted"] is not True
            or interaction["lastInputKind"] != "pointer-control"
            or interaction["physicsStepCount"] < 100
            or interaction["bodyCollisionCount"] < 1
            or interaction["floorCollisionCount"] < 1
            or interaction["materialFlashMutationCount"] < 1
            or interaction["peakImpulse"] <= 0
            or interaction["peakRiskRatio"] < .65
            or interaction["bodyCount"] < 6
            or not interaction["webglReady"]
            or interaction["assetCount"] != 3
            or interaction["assetByteLength"] != 272053
            or interaction["assetChecksum"] != 2809018893
            or interaction["assetWidth"] != 512
            or interaction["assetHeight"] != 512
            or interaction["integratedTextureKeys"] != ["cold", "fragile", "heavy"]
            or interaction["textureDrawCount"] < 5
            or interaction["draws"] < 5
            or len(interaction["interactionLedger"]) < 11
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted aimed and controlled parcel drops, a side-impact sled, reset, keyboard aiming, fixed-step impulse feedback, and three decoded p5 WebGL package textures without automatic or capture-clock motion: assertion={assertion!r}; interaction={interaction!r}")
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
    elif demo["id"] == "live-hand-landmark-video-overlay":
        assertion = page.evaluate("async () => await window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        ledger_types = {entry["type"] for entry in interaction["ledger"]}
        if (
            not assertion
            or interaction["task"] != "hand-rehabilitation-landmark-calibration"
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard", "control"]
            or not interaction["userInputRequired"]
            or interaction["sampleDisclosure"] != "fictional-local-calibration-sample-not-live-camera"
            or interaction["landmarkSource"] != "hand-labeled-coordinates-deterministically-aligned-to-local-video-frames"
            or interaction["automaticPlayback"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["previewClockDriven"]
            or interaction["previewClockMutationCount"] != 0
            or interaction["syntheticInputDispatch"]
            or not interaction["userOwnedPlayback"]
            or not interaction["firstFrameStatic"]
            or not interaction["initialStaticVerified"]
            or interaction["inputCount"] < 25
            or interaction["inputCount"] != interaction["trustedInputCount"]
            or interaction["rejectedUntrustedCount"] != 0
            or interaction["pointerInputCount"] < 14
            or interaction["mouseInputCount"] < 14
            or interaction["keyboardInputCount"] < 7
            or interaction["controlInputCount"] < 6
            or interaction["playAuthorizationCount"] < 2
            or interaction["playCount"] < 2
            or interaction["pauseCount"] < 2
            or interaction["seekCount"] < 7
            or interaction["exerciseChangeCount"] < 3
            or interaction["calibrationMutationCount"] < 6
            or interaction["resetCount"] < 1
            or interaction["pointerCaptureCount"] < 2
            or interaction["pointerReleaseCount"] < 2
            or interaction["dragUpdateCount"] < 6
            or not interaction["sourceImageDimensionsValid"]
            or interaction["sourceImageDecodedCount"] != 1
            or interaction["sourceImageChecksum"] <= 0
            or interaction["sourceImageSampledPixelCount"] != 5184
            or not interaction["videoSourceVerified"]
            or interaction["videoByteLength"] != 650861
            or interaction["videoByteChecksum"] <= 0
            or not interaction["videoMetadataReady"]
            or not interaction["videoDataReady"]
            or interaction["videoWidth"] != 960
            or interaction["videoHeight"] != 540
            or interaction["videoFrameCallbackCount"] < 2
            or interaction["videoProgressMutationCount"] < 2
            or interaction["videoFrameChecksum"] <= 0
            or interaction["videoFrameChannelSum"] <= 0
            or interaction["initialVideoFrameChecksum"] <= 0
            or interaction["videoFrameChecksumChangeCount"] < 1
            or len(interaction["videoFrameChecksums"]) < 2
            or not interaction["p5Ready"]
            or not interaction["overlayReady"]
            or interaction["overlayPointCount"] != 21
            or interaction["overlaySegmentCount"] != 23
            or interaction["landmarkCount"] != 21
            or interaction["currentLandmarkCount"] != 21
            or not interaction["coordinateBoundsValid"]
            or interaction["playing"]
            or interaction["ended"]
            or interaction["exerciseIndex"] != 1
            or interaction["currentTime"] <= 0
            or interaction["currentFrameIndex"] <= 0
            or interaction["calibrationOffsetX"] == 0
            or interaction["calibrationOffsetY"] == 0
            or interaction["resultState"] != "paused-review"
            or interaction["pointerCaptured"]
            or interaction["activePointerId"] is not None
            or interaction["activePointerType"] is not None
            or not {"play", "pause", "seek", "exercise", "calibration", "capture", "release", "reset"}.issubset(ledger_types)
        ):
            raise RuntimeError(f"{demo['id']} did not capture two trusted user-owned video play/pause cycles, direct local-video seeking, exercise changes, opposed captured overlay calibration drags, reset, nonzero video-frame checksums, and a final paused rehabilitation review: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "scroll-controlled-video-scrubbing":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "scrub-local-growth-video-by-human-input"
            or interaction["acceptedInputs"] != ["wheel", "mouse", "touch", "pen", "keyboard", "control"]
            or not interaction["userInputRequired"]
            or interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["automaticRehearsal"]
            or interaction["previewClockDriven"]
            or interaction["syntheticDispatch"]
            or interaction["previewClockMutations"] != 0
            or interaction["sourceKind"] != "project-local-static-url"
            or interaction["inputPolicy"] != "trusted-only"
            or interaction["capturePolicy"] != "pointer-capture"
            or not interaction["ready"]
            or not interaction["initialStaticVerified"]
            or not interaction["seekConsistencyValid"]
            or not interaction["chapterMappingVerified"]
            or not interaction["boundaryReleaseMathVerified"]
            or interaction["trustedInputCount"] < 20
            or interaction["untrustedInputCount"] != 0
            or interaction["wheelInputCount"] < 9
            or interaction["keyboardInputCount"] < 2
            or interaction["controlInputCount"] < 2
            or interaction["captureCount"] != 2
            or interaction["captureVerifiedCount"] != 2
            or interaction["releaseCount"] != 2
            or interaction["dragMoveCount"] < 8
            or interaction["chapterControlCount"] < 1
            or interaction["resetCount"] < 1
            or interaction["resetControlCount"] < 1
            or interaction["pageReleaseCount"] < 1
            or interaction["seekRequestCount"] < 12
            or interaction["seekSettledCount"] < 8
            or interaction["playAttemptCount"] != 0
            or interaction["lastInputTrusted"] is not True
            or interaction["lastBoundaryReleaseTrusted"] is not True
            or interaction["lastResetTrusted"] is not True
            or not interaction["resetSnapshotValid"]
            or interaction["dragging"]
            or interaction["pointer"] is not None
            or interaction["frameChecksums"] is None
            or len(interaction["frameChecksums"]) != 5
            or len(set(interaction["frameChecksums"])) != 5
            or interaction["duration"] < 5.9
            or interaction["duration"] > 6.1
            or interaction["seekLimit"] < 5.8
            or interaction["currentTime"] <= 0
            or interaction["currentChapter"] not in (2, 3)
            or interaction["overlayDrawCount"] < 8
        ):
            raise RuntimeError(f"{demo['id']} did not capture trusted wheel, outward boundary release, reset, two opposed captured drags, chapter and keyboard selection against one real seekable local growth video: assertion={assertion!r}; interaction={interaction!r}")
    elif demo["id"] == "pixel-grid-content-dissolve":
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        interaction = page.evaluate("window.__PREVIEW_INTERACTION_STATE__")
        if (
            not assertion
            or interaction["task"] != "human-operated-semantic-content-tree-replacement"
            or interaction["acceptedInputs"] != ["mouse", "touch", "pen", "keyboard", "button-control"]
            or interaction["automaticCycle"]
            or interaction["automaticPlayback"]
            or interaction["automaticFallback"]
            or interaction["captureClockDriven"]
            or interaction["syntheticInputDispatch"]
            or not interaction["userRequestRequired"]
            or not interaction["initialFrameStatic"]
            or not interaction["renderIgnoresPreviewClock"]
            or not interaction["fullStagePointerSurface"]
            or interaction["semanticTreeCount"] != 2
            or interaction["semanticTreeIds"] != ["tidal", "dune"]
            or min(interaction["semanticNodeCounts"]) < 8
            or len(interaction["treeEvidence"]) != 2
            or interaction["currentTreeIndex"] != 1
            or interaction["activeTreeId"] != "dune"
            or interaction["transitionActive"]
            or interaction["phase"] != "settled"
            or interaction["waveProgress"] != 0
            or interaction["completedSwapCount"] < 5
            or interaction["cancelledSwapCount"] < 1
            or interaction["completionBoundaryReachedCount"] < 4
            or interaction["transitionRequestCount"] < 6
            or interaction["inputCount"] < 14
            or interaction["pointerDownCount"] != 2
            or interaction["pointerMoveCount"] < 8
            or interaction["pointerReleaseCount"] != 2
            or interaction["pointerCaptureCount"] != 2
            or interaction["pointerReleaseCaptureCount"] != 2
            or interaction["pointerCaptured"]
            or interaction["buttonActivationCount"] != 2
            or interaction["keyboardInputCount"] < 10
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["lastInputTrusted"] is not True
            or interaction["animationActive"]
            or interaction["inputOwnedAnimationCount"] < 5
            or interaction["inputOwnedAnimationFrameCount"] < 5
            or interaction["inputOwnedAnimationActive"]
            or interaction["assetEvidenceReady"] is not True
            or len(interaction["assetEvidence"]) != 2
            or interaction["distinctAssetChecksumCount"] != 2
            or interaction["distinctPixelSampleCount"] != 2
            or interaction["p5DecodedAssetCount"] != 2
            or interaction["p5AssetFailureCount"] != 0
            or interaction["p5DrawCount"] < 8
            or interaction["pixelBandCellCount"] != 0
            or interaction["pixelSampleCount"] <= 0
            or interaction["previewRenderCallCount"] < 30
        ):
            raise RuntimeError(f"{demo['id']} did not capture two complete semantic content-tree replacements, one cancelled captured drag, stepped keyboard scrubbing, p5 image-sampled pixel evidence, and strict trusted human input: assertion={assertion!r}; interaction={interaction!r}")
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
    elif demo["id"] == "dom-aware-drag-spawned-fish-flock":
        interaction = page.evaluate("window.__DOM_AWARE_FISH_STATE__")
        assertion = page.evaluate("window.__PREVIEW_RUNTIME_ASSERT__()")
        if (
            not assertion
            or interaction["task"] != "trusted-human-drag-releases-a-school-that-avoids-a-measured-html-reef"
            or interaction["claimedLibrary"] != "p5@2.3.0"
            or interaction["assetStrategy"] != "code-native-fish-and-measured-dom-obstacle-no-functional-raster-input-required"
            or interaction["automaticPlayback"]
            or interaction["automaticCycle"]
            or interaction["automaticLoop"]
            or interaction["automaticRehearsal"]
            or interaction["automaticFallback"]
            or interaction["syntheticInputDispatch"]
            or interaction["previewClockMutationBeforeInput"]
            or interaction["phase"] != "held"
            or interaction["settleProgress"] != 1
            or interaction["pointerDownCount"] != 1
            or interaction["pointerMoveCount"] < 12
            or interaction["pointerReleaseCount"] != 1
            or interaction["pointerCaptureCount"] != 1
            or interaction["pointerCaptureReleaseCount"] != 1
            or interaction["inputCount"] != interaction["trustedInputCount"]
            or interaction["rejectedUntrustedInputCount"] != 0
            or interaction["fishCount"] != interaction["spawnCount"]
            or interaction["fishCount"] < 8
            or interaction["fishCount"] > 42
            or interaction["rejectedObstacleSpawnCount"] <= 0
            or interaction["avoidanceActivationCount"] <= 0
            or interaction["uniqueAvoidingFishCount"] <= 0
            or interaction["obstacleIntrusionCount"] != 0
            or interaction["closestNormalizedObstacleDistance"] < .999
            or interaction["obstacleBoundsSource"] != "getBoundingClientRect"
            or interaction["measuredObstacleSampleCount"] < 1
            or not interaction["obstacleBoundsValidated"]
            or not interaction["canvasSizeValidated"]
            or not interaction["stageCoverageValidated"]
            or not interaction["initialStillVerified"]
            or not interaction["finalResultValidated"]
            or interaction["finalStableSignature"] == "none"
        ):
            raise RuntimeError(f"{demo['id']} did not capture a real finite fish release around measured DOM bounds: {interaction!r}")
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
            [
                str(DEMO_ROOT / "node_modules" / ".bin" / "vite"),
                "preview",
                "--host", "127.0.0.1",
                "--port", str(port),
                "--strictPort",
                "--logLevel", "silent",
            ]
            if args.built
            else [require_command("npm"), "run", "dev", "--", "--host", "127.0.0.1", "--port", str(port), "--strictPort"]
        )
        server = subprocess.Popen(
            server_command,
            cwd=DEMO_ROOT,
            stdout=log_handle,
            stderr=subprocess.STDOUT,
        )

    try:
        def demo_url(demo: dict) -> str:
            path = f"{demo['id']}.html"
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
