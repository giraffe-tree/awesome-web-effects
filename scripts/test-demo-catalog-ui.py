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
            expect(hero).to_have_attribute("data-autoplay-interval", "6000")
            expect(hero).to_have_attribute("data-autoplay-state", "playing")
            hero.hover()
            expect(hero).to_have_attribute("data-autoplay-state", "paused")
            page.locator(".site-nav").hover()
            expect(hero).to_have_attribute("data-autoplay-state", "playing")
            hero.focus()
            expect(hero).to_have_attribute("data-autoplay-state", "paused")
            page.locator("#language").focus()
            expect(hero).to_have_attribute("data-autoplay-state", "playing")
            hero.press("ArrowRight")
            expect(hero).to_have_attribute("data-step", "1")
            page.locator('[data-hero-step="3"]').click()
            expect(hero).to_have_attribute("data-step", "3")
            hero_toggle = page.locator("#hero-story-toggle")
            expect(hero_toggle).to_be_visible()
            hero_toggle.click()
            expect(hero_toggle).to_have_text("Play")
            expect(hero).to_have_attribute("data-autoplay-state", "off")
            language_select = page.locator("#language")
            locale_directions = {
                "en": "ltr", "zh-Hans": "ltr", "hi": "ltr", "es": "ltr", "ar": "rtl",
                "fr": "ltr", "bn": "ltr", "pt": "ltr", "id": "ltr", "ur": "rtl",
                "ru": "ltr", "de": "ltr", "ja": "ltr", "pcm": "ltr", "arz": "rtl",
                "mr": "ltr", "vi": "ltr", "te": "ltr", "sw": "ltr", "ha": "ltr",
            }
            expect(language_select.locator("option")).to_have_count(20)
            language_select.select_option("zh-Hans")
            expect(page.locator("#hero-kicker")).to_have_text("网页交互动效图鉴")
            expect(page.locator("#hero-title")).to_have_text("找网页动效，看 Demo，一键复制 Prompt")
            expect(page.locator("#hero-title .hero-title-line")).to_have_count(3)
            expect(page.locator("#hero-copy")).to_contain_text("可运行预览、最小代码和可一键复制的实现 Prompt")
            chinese_title_metrics = page.locator("#hero-title").evaluate(
                """title => {
                    const style = getComputedStyle(title);
                    return {
                        fontSize: Number.parseFloat(style.fontSize),
                        lineHeight: Number.parseFloat(style.lineHeight),
                        linesFit: [...title.querySelectorAll('.hero-title-line')].every(
                            line => line.getBoundingClientRect().width <= title.getBoundingClientRect().width + 1
                        ),
                    };
                }"""
            )
            expected_chinese_line_height = chinese_title_metrics["fontSize"] * 0.86 + 4
            assert abs(chinese_title_metrics["lineHeight"] - expected_chinese_line_height) < 0.2
            assert chinese_title_metrics["linesFit"]
            page.set_viewport_size({"width": 1024, "height": 960})
            assert page.locator("#hero-title").evaluate(
                """title => [...title.querySelectorAll('.hero-title-line')].every(
                    line => line.getBoundingClientRect().width <= title.getBoundingClientRect().width + 1
                )"""
            )
            page.set_viewport_size({"width": 1440, "height": 960})
            expect(page.locator("#hero-story-eyebrow")).to_have_text("实时交互叙事")
            language_select.select_option("en")
            expect(page.locator("#hero-story-eyebrow")).to_have_text("Live interaction story")

            one_line_prompt = page.locator("#one-line-agent-prompt")
            expect(page.locator("#agent-prompt")).to_be_visible()
            assert page.locator("#agent-prompt").evaluate("section => section.parentElement?.classList.contains('hero-layout')")
            expect(one_line_prompt).to_be_editable()
            assert one_line_prompt.evaluate("element => element.tagName") == "TEXTAREA"
            english_prompt = one_line_prompt.input_value()
            assert english_prompt and "\n" not in english_prompt and len(english_prompt) < 520
            one_line_prompt.focus()
            assert page.evaluate("document.activeElement.id") == "one-line-agent-prompt"
            for requirement in [
                "https://giraffe-tree.github.io/awesome-web-effects/",
                "read-only", "prefers-reduced-motion", "browser check",
            ]:
                assert requirement in english_prompt
            hero_prompt_button = page.locator("#agent-prompt-action")
            expect(hero_prompt_button).to_have_text("Copy prompt")
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

            edited_home_prompt = "Use this edited prompt for the current page only."
            one_line_prompt.fill(edited_home_prompt)
            page.wait_for_timeout(1500)
            hero_prompt_button.click()
            expect(hero_prompt_button).to_have_text("Prompt copied")
            assert page.evaluate("navigator.clipboard.readText()") == edited_home_prompt
            page.reload(wait_until="networkidle")
            expect(page.locator("#one-line-agent-prompt")).to_be_editable()
            assert page.locator("#one-line-agent-prompt").input_value() == english_prompt
            assert edited_home_prompt not in page.evaluate("Object.values(localStorage).join(' ')")

            language_select.select_option("zh-Hans")
            expect(page.locator("#agent-prompt-title")).to_have_text("一键优化你的项目动效")
            chinese_prompt = one_line_prompt.input_value()
            assert chinese_prompt and "\n" not in chinese_prompt and len(chinese_prompt) < 260 and "作为只读参考" in chinese_prompt
            expect(hero_prompt_button).to_have_text("复制 Prompt")
            page.wait_for_timeout(1600)
            expect(hero_prompt_button).to_have_text("复制 Prompt")
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
            recommended_filter = page.locator('#filters [data-category="recommended"]')
            expect(recommended_filter).to_have_attribute("aria-pressed", "true")
            expect(rows).to_have_count(14)
            assert page.locator("#catalog-controls").evaluate("controls => getComputedStyle(controls).position") != "sticky"
            page.locator('#filters [data-category="all"]').click()
            expect(rows).to_have_count(expected_effect_count)
            expect(page.locator("#effect-list .effect-score")).to_have_count(0)
            expect(page.locator("#effect-list .media-load-state[role]")).to_have_count(0)
            expect(page.locator('#effect-list picture source[type="image/webp"]')).to_have_count(
                len(admitted_local_preview_ids)
            )
            desktop_grid_columns = page.locator("#effect-list").evaluate(
                "element => getComputedStyle(element).gridTemplateColumns.split(' ').length"
            )
            assert desktop_grid_columns == 3
            full_bleed_geometry = page.locator("#scroll-scrubbed-master-timeline").evaluate(
                """card => {
                    const main = card.querySelector('.effect-main').getBoundingClientRect();
                    const preview = card.querySelector('.row-preview').getBoundingClientRect();
                    const overlay = card.querySelector('.effect-card-overlay').getBoundingClientRect();
                    const image = card.querySelector('.row-preview img');
                    const imageFit = getComputedStyle(image).objectFit;
                    return {
                        main: [main.width, main.height, main.bottom],
                        preview: [preview.width, preview.height],
                        overlayBottom: overlay.bottom,
                        imageFit,
                        naturalSize: [image.naturalWidth, image.naturalHeight],
                        currentSource: image.currentSrc,
                    };
                }"""
            )
            assert abs(full_bleed_geometry["main"][0] - full_bleed_geometry["preview"][0]) < 1
            assert abs(full_bleed_geometry["main"][1] - full_bleed_geometry["preview"][1]) < 1
            assert abs(full_bleed_geometry["main"][2] - full_bleed_geometry["overlayBottom"]) < 1
            assert abs(full_bleed_geometry["main"][0] / full_bleed_geometry["main"][1] - 16 / 9) < 0.01
            assert full_bleed_geometry["imageFit"] == "contain"
            assert full_bleed_geometry["naturalSize"] == [640, 360]
            assert full_bleed_geometry["currentSource"].endswith("/gifs/webp/scroll-scrubbed-master-timeline.webp")
            transition_filter = page.locator('#filters [data-category="transition"]')
            expected_transition_count = page.locator(
                '#effect-list .effect-row[data-category="transition"]'
            ).count()
            transition_filter.click()
            expect(transition_filter).to_have_attribute("aria-pressed", "true")
            expect(rows).to_have_count(expected_transition_count)
            page.locator('#filters [data-category="all"]').click()
            expect(rows).to_have_count(expected_effect_count)
            recommended_filter.click()
            expect(recommended_filter).to_have_attribute("aria-pressed", "true")
            expect(rows).to_have_count(14)
            page.locator('#filters [data-category="all"]').click()
            expect(rows).to_have_count(expected_effect_count)
            page.wait_for_timeout(650)

            for effect_id in admitted_local_preview_ids:
                migrated_row = page.locator(f"#{effect_id}")
                expect(migrated_row.locator(".row-preview img")).to_have_attribute(
                    "src", f"./gifs/captured/{effect_id}.gif"
                )
                expect(migrated_row.locator(".preview-demo-link")).to_have_count(1)

            page.goto(f"{origin}/?lang=en#scroll-scrubbed-master-timeline", wait_until="networkidle")
            real_row = page.locator("#scroll-scrubbed-master-timeline")
            expect(real_row).to_be_in_viewport()
            expect(real_row.locator(".detail-panel")).to_be_visible()
            expect(real_row.locator(".code-button")).to_have_attribute("aria-expanded", "true")
            effect_permalink = real_row.locator(".permalink")
            expect(effect_permalink).to_have_attribute(
                "href",
                "https://giraffe-tree.github.io/awesome-web-effects/?lang=en#scroll-scrubbed-master-timeline",
            )
            expect(effect_permalink.locator("code")).to_have_text(
                "https://giraffe-tree.github.io/awesome-web-effects/?lang=en#scroll-scrubbed-master-timeline"
            )
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
            expect(modal.locator(".effect-modal-dialog")).to_have_attribute("data-details-open", "false")
            expect(modal.locator("#modal-detail-panel")).to_be_hidden()
            action_rail = modal.locator(".modal-action-rail")
            expect(action_rail).to_be_visible()
            panel_toggle = modal.locator(".modal-rail-toggle")
            expect(panel_toggle).to_have_attribute("aria-expanded", "false")
            assert live_preview.bounding_box()["width"] > 900
            page.wait_for_timeout(250)
            desktop_screenshot = ROOT / "tmp" / "catalog-detail-desktop.png"
            desktop_screenshot.parent.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(desktop_screenshot), full_page=False)
            modal_prompt_button = modal.locator(".modal-rail-prompt")
            modal_prompt_label = modal_prompt_button.locator("[data-copy-label]")
            modal_code_button = modal.locator(".modal-rail-code")
            modal_code_label = modal_code_button.locator("[data-copy-label]")
            modal_prompt_text = modal.locator("#modal-prompt-text")
            expect(modal_prompt_text).to_be_hidden()
            assert modal_prompt_text.evaluate("element => element.tagName") == "TEXTAREA"
            effect_prompt = modal_prompt_text.input_value()
            expect(modal_prompt_label).to_have_text("Copy prompt")
            modal_prompt_button.focus()
            page.keyboard.press("Enter")
            expect(modal.locator(".effect-modal-dialog")).to_have_attribute("data-details-open", "true")
            expect(modal.locator("#modal-detail-panel")).to_be_visible()
            expect(panel_toggle).to_have_attribute("aria-expanded", "true")
            expect(modal.locator(".modal-prompt-card")).to_have_attribute("open", "")
            expect(modal_prompt_text).to_be_visible()
            expect(modal_prompt_label).to_have_text("Prompt copied")
            assert page.evaluate("navigator.clipboard.readText()") == effect_prompt
            page.wait_for_timeout(250)
            expanded_preview_width = live_preview.bounding_box()["width"]
            assert 560 < expanded_preview_width < 800
            expect(modal.locator(".modal-score-total")).to_contain_text("85")
            expect(modal.locator(".score-dimension")).to_have_count(6)
            assert "Scroll-scrubbed master timeline" in effect_prompt
            assert "https://giraffe-tree.github.io/awesome-web-effects/?lang=en#scroll-scrubbed-master-timeline" in effect_prompt
            assert "observable acceptance criteria" in effect_prompt
            assert "evidence per criterion" in effect_prompt
            assert len(effect_prompt) < 620 and "Interaction contract" not in effect_prompt
            expect(modal.locator(".modal-code-card code")).to_contain_text("gsap.registerPlugin")
            expanded_screenshot = ROOT / "tmp" / "catalog-detail-desktop-expanded.png"
            page.screenshot(path=str(expanded_screenshot), full_page=False)
            modal_code_button.click()
            expect(modal.locator(".modal-code-card")).to_have_attribute("open", "")
            expect(modal.locator(".modal-prompt-card")).not_to_have_attribute("open", "")
            expect(modal_prompt_text).to_be_hidden()
            expect(modal_code_label).to_have_text("Copied")
            assert "gsap.registerPlugin" in page.evaluate("navigator.clipboard.readText()")
            modal.locator(".modal-rail-details").click()
            expect(modal.locator(".modal-more")).to_have_attribute("open", "")
            expect(modal.locator(".modal-code-card")).not_to_have_attribute("open", "")

            edited_effect_prompt = f"{effect_prompt} Keep this page-only edit."
            modal.locator(".modal-prompt-card > summary").click()
            expect(modal.locator(".modal-more")).not_to_have_attribute("open", "")
            expect(modal.locator(".modal-code-card")).not_to_have_attribute("open", "")
            expect(modal_prompt_text).to_be_visible()
            expect(modal_prompt_text).to_be_editable()
            modal_prompt_text.fill(edited_effect_prompt)
            page.wait_for_timeout(1500)
            modal_prompt_button.click()
            expect(modal_prompt_label).to_have_text("Prompt copied")
            assert page.evaluate("navigator.clipboard.readText()") == edited_effect_prompt
            panel_toggle.click()
            expect(modal.locator(".effect-modal-dialog")).to_have_attribute("data-details-open", "false")
            expect(modal.locator("#modal-detail-panel")).to_be_hidden()

            page.keyboard.press("Escape")
            expect(modal).to_be_hidden()
            assert page.evaluate("document.activeElement?.id") == "scroll-scrubbed-master-timeline"
            real_row.locator(".effect-cell").click()
            expect(modal).to_be_visible()
            expect(modal.locator(".effect-modal-dialog")).to_have_attribute("data-details-open", "false")
            assert modal.locator("#modal-prompt-text").input_value() == edited_effect_prompt
            page.keyboard.press("Escape")
            expect(modal).to_be_hidden()

            blurhash_row = page.locator("#blurhash-to-photo-progressive-reveal")
            blurhash_row.locator(".effect-cell").click()
            expect(modal).to_be_visible()
            blurhash_preview = modal.locator(".modal-preview-frame")
            expect(blurhash_preview).to_have_attribute(
                "src", "./preview-demos/dist/blurhash-to-photo-progressive-reveal.html"
            )
            expect(blurhash_preview).to_have_attribute("width", "320")
            expect(blurhash_preview).to_have_attribute("height", "180")
            expect(modal.locator(".modal-preview img")).to_have_count(0)
            blurhash_frame = page.frame(
                url=lambda url: url.endswith("/preview-demos/dist/blurhash-to-photo-progressive-reveal.html")
            )
            assert blurhash_frame is not None, "BlurHash runnable detail preview iframe did not load."
            blurhash_frame.wait_for_function(
                "window.__PREVIEW_READY__ === true || Boolean(window.__PREVIEW_ERROR__)"
            )
            assert not blurhash_frame.evaluate("window.__PREVIEW_ERROR__ || null")
            blurhash_geometry = blurhash_frame.evaluate(
                """() => {
                    const canvas = document.querySelector('canvas');
                    const photo = document.querySelector('.photo-frame').getBoundingClientRect();
                    return {
                        viewport: [innerWidth, innerHeight],
                        canvas: [canvas.width, canvas.height],
                        photo: [photo.width, photo.height],
                        capture: window.__PREVIEW_META__?.capture,
                    };
                }"""
            )
            assert blurhash_geometry == {
                "viewport": [320, 180],
                "canvas": [320, 180],
                "photo": [209, 144],
                "capture": "real-demo",
            }
            blurhash_start = blurhash_frame.locator("canvas").evaluate("canvas => canvas.toDataURL()")
            expect(blurhash_frame.locator("#decode-state")).to_have_text("HASH · HOVER")
            scaled_preview_box = blurhash_preview.bounding_box()
            assert scaled_preview_box
            preview_scale = scaled_preview_box["width"] / 320
            page.mouse.move(
                scaled_preview_box["x"] + 230 * preview_scale,
                scaled_preview_box["y"] + 90 * preview_scale,
            )
            expect(blurhash_frame.locator("#decode-state")).to_have_text("PHOTO · LIVE")
            blurhash_revealed = blurhash_frame.locator("canvas").evaluate("canvas => canvas.toDataURL()")
            assert blurhash_start != blurhash_revealed, "Live BlurHash preview did not render different states."
            pointer_interaction = blurhash_frame.evaluate("window.__PREVIEW_INTERACTION_STATE__()")
            assert pointer_interaction["pointerEvents"] >= 1
            assert pointer_interaction["pointerOverPhoto"] and pointer_interaction["targetReveal"] == 1
            page.mouse.click(
                scaled_preview_box["x"] + 230 * preview_scale,
                scaled_preview_box["y"] + 90 * preview_scale,
            )
            expect(blurhash_frame.locator("#load-hint")).to_have_text("LOCKED · TAP TO RESET")
            page.mouse.move(
                scaled_preview_box["x"] + 32 * preview_scale,
                scaled_preview_box["y"] + 90 * preview_scale,
            )
            expect(blurhash_frame.locator("#decode-state")).to_have_text("PHOTO · LIVE")
            page.mouse.move(
                scaled_preview_box["x"] + 230 * preview_scale,
                scaled_preview_box["y"] + 90 * preview_scale,
            )
            page.mouse.click(
                scaled_preview_box["x"] + 230 * preview_scale,
                scaled_preview_box["y"] + 90 * preview_scale,
            )
            expect(blurhash_frame.locator("#decode-state")).to_have_text("HASH · HOVER")
            blurhash_host = blurhash_frame.locator("#blurhash-host")
            blurhash_host.press("Space")
            expect(blurhash_frame.locator("#decode-state")).to_have_text("PHOTO · LIVE")
            blurhash_host.press("Escape")
            expect(blurhash_frame.locator("#decode-state")).to_have_text("HASH · HOVER")
            keyboard_interaction = blurhash_frame.evaluate("window.__PREVIEW_INTERACTION_STATE__()")
            assert keyboard_interaction["keyboardEvents"] == 2
            assert not keyboard_interaction["locked"]
            live_shell_box = modal.locator(".modal-preview-frame-shell").bounding_box()
            assert live_shell_box and scaled_preview_box
            assert abs(live_shell_box["width"] - scaled_preview_box["width"]) < 1
            assert abs(live_shell_box["height"] - scaled_preview_box["height"]) < 1
            modal.locator(".effect-modal-close").click()
            expect(modal).to_be_hidden()

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
            assert page.evaluate("navigator.clipboard.readText()") == edited_effect_prompt

            page.reload(wait_until="networkidle")
            real_row.locator(".effect-cell").click()
            expect(modal).to_be_visible()
            reset_effect_prompt = modal.locator("#modal-prompt-text").input_value()
            assert reset_effect_prompt == effect_prompt
            assert edited_effect_prompt not in page.evaluate("Object.values(localStorage).join(' ')")
            page.keyboard.press("Escape")
            expect(modal).to_be_hidden()

            page.set_viewport_size({"width": 390, "height": 844})
            page.locator("#language").select_option("ur")
            expect(page.locator("html")).to_have_attribute("dir", "rtl")
            assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1")
            mobile_grid_columns = page.locator("#effect-list").evaluate(
                "element => getComputedStyle(element).gridTemplateColumns.split(' ').length"
            )
            assert mobile_grid_columns == 1
            mobile_card_box = page.locator("#scroll-scrubbed-master-timeline .effect-main").bounding_box()
            assert mobile_card_box
            assert abs(mobile_card_box["width"] / mobile_card_box["height"] - 16 / 9) < 0.01
            page.locator("#language").select_option("en")
            mobile_prompt_screenshot = ROOT / "tmp" / "agent-prompt-mobile.png"
            page.locator("#agent-prompt").screenshot(path=str(mobile_prompt_screenshot))
            real_row.locator(".effect-cell").click()
            expect(modal.locator(".effect-modal-dialog")).to_be_visible()
            expect(modal.locator(".modal-preview-frame")).to_have_count(1)
            mobile_preview_box = modal.locator(".modal-preview-frame").bounding_box()
            assert mobile_preview_box["width"] > 360
            expect(modal.locator("#modal-detail-panel")).to_be_hidden()
            mobile_rail = modal.locator(".modal-action-rail")
            expect(mobile_rail).to_be_visible()
            assert mobile_rail.evaluate("element => getComputedStyle(element).flexDirection") == "row"
            modal.locator(".modal-rail-code").click()
            expect(modal.locator("#modal-detail-panel")).to_be_visible()
            expect(modal.locator(".modal-code-card")).to_have_attribute("open", "")
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
            reduced_page.locator("#agent-prompt-action").click()
            expect(reduced_page.locator("#agent-prompt-action")).to_have_text("Prompt copied")
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

    print(f"Catalog UI verified: 20 locales (including RTL and URL persistence), {expected_effect_count} admitted demos, 14 homepage recommendations, large default live previews with a persistent action rail, copy-and-expand prompt/code flows, editable page-only homepage and per-effect prompts with refresh reset, mutually exclusive prompt/code/evidence disclosure, unified light catalog styling, paused 6s hero autoplay, uncropped 16:9 cards, loading/error transitions, native-size official GIFs, focus, reduced motion, and mobile layout.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
