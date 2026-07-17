#!/usr/bin/env python3
"""Exercise the catalog detail dialog and its copy actions in a real browser."""

from __future__ import annotations

import os
import shutil
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
DEMO_ROOT = ROOT / "demo"


def available_port() -> int:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return int(listener.getsockname()[1])


def chrome_path() -> str:
    candidates = [
        os.environ.get("CHROME_PATH"),
        shutil.which("google-chrome"),
        shutil.which("chromium"),
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return str(candidate)
    raise RuntimeError("Chrome/Chromium was not found. Set CHROME_PATH to its executable.")


def wait_for_server(url: str, server: subprocess.Popen) -> None:
    deadline = time.monotonic() + 20
    while time.monotonic() < deadline:
        if server.poll() is not None:
            raise RuntimeError("Static demo server exited before the UI test started.")
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                if response.status < 500:
                    return
        except Exception:
            time.sleep(0.1)
    raise RuntimeError("Timed out waiting for the static demo server.")


def main() -> int:
    port = available_port()
    origin = f"http://127.0.0.1:{port}"
    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", str(DEMO_ROOT)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    try:
        wait_for_server(f"{origin}/", server)
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path=chrome_path(), headless=True)
            context = browser.new_context(viewport={"width": 1440, "height": 960})
            context.grant_permissions(["clipboard-read", "clipboard-write"], origin=origin)
            page = context.new_page()
            page.goto(f"{origin}/", wait_until="networkidle")

            rows = page.locator("#effect-list .effect-row")
            expect(rows).to_have_count(242)

            real_row = page.locator("#scroll-scrubbed-master-timeline")
            real_row.locator(".effect-cell").click()
            modal = page.locator("#effect-modal")
            expect(modal).to_be_visible()
            expect(modal.locator(".modal-preview img")).to_have_count(1)
            expect(modal.locator(".modal-code-card code")).to_contain_text("gsap.registerPlugin")
            page.wait_for_timeout(250)
            desktop_screenshot = ROOT / "tmp" / "catalog-detail-desktop.png"
            desktop_screenshot.parent.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(desktop_screenshot), full_page=False)
            modal.locator(".modal-copy-code").click()
            expect(modal.locator(".modal-copy-code")).to_have_text("Copied")

            page.keyboard.press("Escape")
            expect(modal).to_be_hidden()
            assert page.evaluate("document.activeElement?.id") == "scroll-scrubbed-master-timeline"

            unavailable_row = page.locator("#pinned-horizontal-scroll-scene")
            unavailable_row.locator(".effect-cell").click()
            expect(modal.locator(".modal-preview-unavailable")).to_be_visible()
            expect(modal.locator(".modal-preview img")).to_have_count(0)
            expect(modal.locator(".modal-code-card code")).to_contain_text("ScrollTrigger")
            page.keyboard.press("Escape")

            prompt_button = unavailable_row.locator(".prompt-button")
            prompt_button.click()
            expect(modal).to_be_hidden()
            expect(prompt_button).to_have_text("Prompt copied")

            page.set_viewport_size({"width": 390, "height": 844})
            unavailable_row.locator(".effect-cell").click()
            expect(modal.locator(".effect-modal-dialog")).to_be_visible()
            expect(modal.locator(".modal-copy-code")).to_be_visible()
            page.wait_for_timeout(250)
            screenshot = ROOT / "tmp" / "catalog-detail-mobile.png"
            screenshot.parent.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(screenshot), full_page=False)

            context.close()
            browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()
            server.wait()

    print("Catalog UI verified: 242 detail dialogs, preview states, code/prompt copy, focus, and mobile layout.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
