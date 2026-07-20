#!/usr/bin/env python3
"""Exercise the catalog detail dialog and its copy actions in a real browser."""

from __future__ import annotations

import os
import json
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
    provenance = json.loads((DEMO_ROOT / "gifs" / "provenance.json").read_text())
    expected_effect_count = len(provenance["records"])
    admitted_local_preview_ids = [
        record["effectId"] for record in provenance["records"] if record["sourceType"] == "demo"
    ]
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
            page_errors: list[str] = []
            page.on("pageerror", lambda error: page_errors.append(str(error)))
            page.goto(f"{origin}/?lang=en", wait_until="networkidle")

            expect(page.locator("#entry-reveal")).to_have_count(0)
            hero = page.locator("#hero-experience")
            expect(hero).to_have_attribute("data-step", "0")
            hero.press("ArrowRight")
            expect(hero).to_have_attribute("data-step", "1")
            page.locator('[data-hero-step="3"]').click()
            expect(hero).to_have_attribute("data-step", "3")
            hero_toggle = page.locator("#hero-story-toggle")
            expect(hero_toggle).to_be_visible()
            hero_toggle.click()
            expect(hero_toggle).to_have_text("Play")
            language_select = page.locator("#language")
            locale_directions = {
                "en": "ltr", "zh-Hans": "ltr", "hi": "ltr", "es": "ltr", "ar": "rtl",
                "fr": "ltr", "bn": "ltr", "pt": "ltr", "id": "ltr", "ur": "rtl",
                "ru": "ltr", "de": "ltr", "ja": "ltr", "pcm": "ltr", "arz": "rtl",
                "mr": "ltr", "vi": "ltr", "te": "ltr", "sw": "ltr", "ha": "ltr",
            }
            expect(language_select.locator("option")).to_have_count(20)
            language_select.select_option("zh-Hans")
            expect(page.locator("#hero-story-eyebrow")).to_have_text("实时交互叙事")
            language_select.select_option("en")
            expect(page.locator("#hero-story-eyebrow")).to_have_text("Live interaction story")

            one_line_prompt = page.locator("#one-line-agent-prompt")
            english_prompt = one_line_prompt.text_content()
            assert english_prompt and "\n" not in english_prompt
            expect(one_line_prompt).to_have_attribute("tabindex", "0")
            one_line_prompt.focus()
            assert page.evaluate("document.activeElement.id") == "one-line-agent-prompt"
            for requirement in [
                "https://giraffe-tree.github.io/awesome-web-effects/",
                "https://github.com/giraffe-tree/awesome-web-effects",
                "read-only", "prefers-reduced-motion", "browser check",
            ]:
                assert requirement in english_prompt
            hero_prompt_button = page.locator("#prompt-action")
            expect(hero_prompt_button).to_have_text("Copy one-line prompt")
            hero_prompt_button.click()
            expect(hero_prompt_button).to_have_text("Prompt copied")
            assert page.evaluate("navigator.clipboard.readText()") == english_prompt
            expect(page.locator("#copy-status")).to_have_text("Prompt copied")
            page.wait_for_timeout(1600)
            hero_prompt_button.focus()
            page.keyboard.press("Enter")
            expect(hero_prompt_button).to_have_text("Prompt copied")
            assert page.evaluate("navigator.clipboard.readText()") == english_prompt
            prompt_screenshot = ROOT / "tmp" / "agent-prompt-desktop.png"
            prompt_screenshot.parent.mkdir(parents=True, exist_ok=True)
            page.locator("#agent-prompt").screenshot(path=str(prompt_screenshot))

            language_select.select_option("zh-Hans")
            chinese_prompt = one_line_prompt.text_content()
            assert chinese_prompt and "\n" not in chinese_prompt and "作为只读参考" in chinese_prompt
            expect(hero_prompt_button).to_have_text("复制一句话 Prompt")
            page.wait_for_timeout(1600)
            expect(hero_prompt_button).to_have_text("复制一句话 Prompt")
            page.locator("#agent-prompt-action").click()
            expect(page.locator("#agent-prompt-action")).to_have_text("Prompt 已复制")
            assert page.evaluate("navigator.clipboard.readText()") == chinese_prompt
            language_select.select_option("en")

            for locale, direction in locale_directions.items():
                language_select.select_option(locale)
                expect(page.locator("html")).to_have_attribute("lang", locale)
                expect(page.locator("html")).to_have_attribute("dir", direction)
                assert f"lang={locale}" in page.url
                assert page.evaluate("localStorage.getItem('awesome-effects-language')") == locale
                assert page.locator("#hero-kicker").inner_text().strip()
            language_select.select_option("en")
            page.goto(f"{origin}/?lang=ur#agent-prompt", wait_until="networkidle")
            anchored_section_box = page.locator("#agent-prompt").bounding_box()
            sticky_nav_box = page.locator(".site-nav").bounding_box()
            assert anchored_section_box and sticky_nav_box
            assert anchored_section_box["y"] >= sticky_nav_box["height"] + 8
            page.goto(f"{origin}/?lang=ar", wait_until="networkidle")
            expect(page.locator("html")).to_have_attribute("lang", "ar")
            expect(page.locator("html")).to_have_attribute("dir", "rtl")
            page.reload(wait_until="networkidle")
            expect(page.locator("#language")).to_have_value("ar")
            page.locator("#language").select_option("en")

            rows = page.locator("#effect-list .effect-row")
            expect(rows).to_have_count(expected_effect_count)
            expect(page.locator("#effect-list .media-load-state[role]")).to_have_count(0)

            for effect_id in admitted_local_preview_ids:
                migrated_row = page.locator(f"#{effect_id}")
                expect(migrated_row.locator(".row-preview img")).to_have_attribute(
                    "src", f"./gifs/captured/{effect_id}.gif"
                )
                expect(migrated_row.locator(".preview-demo-link")).to_have_count(1)

            real_row = page.locator("#scroll-scrubbed-master-timeline")
            real_row.locator(".effect-cell").click()
            modal = page.locator("#effect-modal")
            expect(modal).to_be_visible()
            live_preview = modal.locator(".modal-preview-frame")
            expect(live_preview).to_have_count(1)
            expect(live_preview).to_have_attribute(
                "src", "./preview-demos/dist/scroll-scrubbed-master-timeline.html"
            )
            expect(modal.locator(".modal-preview img")).to_have_count(0)
            live_frame = page.frame(url=lambda url: url.endswith("/preview-demos/dist/scroll-scrubbed-master-timeline.html"))
            assert live_frame is not None, "Runnable detail preview iframe did not load."
            live_frame.wait_for_function("window.__PREVIEW_READY__ === true || Boolean(window.__PREVIEW_ERROR__)")
            assert not live_frame.evaluate("window.__PREVIEW_ERROR__ || null")
            expect(modal.locator(".modal-preview-live")).to_have_attribute("data-media-state", "ready")
            expect(modal.locator(".modal-preview-live")).to_have_attribute("aria-busy", "false")
            assert live_preview.bounding_box()["width"] > 640
            expect(modal.locator(".modal-score-total")).to_contain_text("85")
            expect(modal.locator(".score-dimension")).to_have_count(6)
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

            official_preview_expectations = {
                "context-aware-custom-cursor": (
                    "https://user-images.githubusercontent.com/11841379/162477170-5dd33ecd-0e72-4fe4-9053-53d7b5557637.gif",
                    "./gifs/mouse-follower.gif",
                ),
                "displacement-map-image-hover": (
                    "https://raw.githubusercontent.com/robin-dela/hover-effect/master/gifs/alex_brown.gif",
                    "./gifs/hover-effect.gif",
                ),
            }
            for effect_id, (upstream_url, fallback_url) in official_preview_expectations.items():
                official_row = page.locator(f"#{effect_id}")
                official_row.locator(".effect-cell").click()
                expect(modal).to_be_visible()
                expect(modal.locator(".modal-preview-frame")).to_have_count(0)
                official_preview = modal.locator(".modal-preview-official img")
                expect(official_preview).to_have_count(1)
                expect(official_preview).to_have_attribute("data-upstream-src", upstream_url)
                expect(official_preview).to_have_attribute("data-fallback-src", fallback_url)
                official_dimensions = official_preview.evaluate(
                    "image => ({ naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height })"
                )
                if not official_preview.evaluate("image => image.classList.contains('is-local-fallback')"):
                    assert official_dimensions["naturalWidth"] >= official_dimensions["width"]
                    assert official_dimensions["naturalHeight"] >= official_dimensions["height"]
                official_preview.evaluate("image => image.dispatchEvent(new Event('error'))")
                expect(official_preview).to_have_attribute("src", fallback_url)
                expect(official_preview).to_have_class("is-local-fallback")
                page.wait_for_function(
                    "image => image.complete && image.naturalWidth === 320 && image.naturalHeight === 180",
                    arg=official_preview.element_handle(),
                )
                expect(modal.locator(".modal-preview-official")).to_have_attribute("data-media-state", "ready")
                official_fallback_box = official_preview.bounding_box()
                assert official_fallback_box["width"] <= 320 and official_fallback_box["height"] <= 180
                official_preview.evaluate("image => image.dispatchEvent(new Event('error'))")
                expect(modal.locator(".modal-preview-official")).to_have_attribute("data-media-state", "error")
                expect(modal.locator(".modal-preview-official .media-load-state")).to_have_attribute("role", "alert")
                page.keyboard.press("Escape")
                expect(modal).to_be_hidden()

            expect(page.locator("#effect-list .paused-preview")).to_have_count(0)
            prompt_button = real_row.locator(".prompt-button")
            prompt_button.click()
            expect(modal).to_be_hidden()
            expect(prompt_button).to_have_text("Prompt copied")

            page.set_viewport_size({"width": 390, "height": 844})
            page.locator("#language").select_option("ur")
            expect(page.locator("html")).to_have_attribute("dir", "rtl")
            assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1")
            page.locator("#language").select_option("en")
            mobile_prompt_screenshot = ROOT / "tmp" / "agent-prompt-mobile.png"
            page.locator("#agent-prompt").screenshot(path=str(mobile_prompt_screenshot))
            real_row.locator(".effect-cell").click()
            expect(modal.locator(".effect-modal-dialog")).to_be_visible()
            expect(modal.locator(".modal-preview-frame")).to_have_count(1)
            mobile_preview_box = modal.locator(".modal-preview-frame").bounding_box()
            assert mobile_preview_box["width"] > 360
            expect(modal.locator(".modal-copy-code")).to_be_visible()
            page.wait_for_timeout(250)
            screenshot = ROOT / "tmp" / "catalog-detail-mobile.png"
            screenshot.parent.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(screenshot), full_page=False)

            assert not page_errors, "Catalog emitted page errors:\n" + "\n".join(page_errors)

            reduced_page = context.new_page()
            reduced_page.emulate_media(reduced_motion="reduce")
            reduced_page.goto(f"{origin}/?lang=en", wait_until="networkidle")
            expect(reduced_page.locator("#entry-reveal")).to_have_count(0)
            expect(reduced_page.locator("#hero-story-toggle")).to_be_hidden()
            reduced_hero = reduced_page.locator("#hero-experience")
            reduced_hero.press("ArrowRight")
            expect(reduced_hero).to_have_attribute("data-step", "1")
            reduced_page.locator("#prompt-action").click()
            expect(reduced_page.locator("#prompt-action")).to_have_text("Prompt copied")
            reduced_page.close()

            context.close()
            browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()
            server.wait()

    print(f"Catalog UI verified: 20 locales (including RTL and URL persistence), {expected_effect_count} admitted demos, one-line and per-effect Agent Prompts, interactive hero, loading/error transitions, live detail previews, native-size official GIFs, visible scores, copy actions, focus, reduced motion, and mobile layout.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
