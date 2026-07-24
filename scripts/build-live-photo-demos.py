#!/usr/bin/env python3
"""Build and validate portrait Live Photo demo packages from real browser effects."""

from __future__ import annotations

import argparse
import importlib.util
import json
import shutil
import subprocess
import tempfile
import uuid
from datetime import date
from pathlib import Path
from types import SimpleNamespace


ROOT = Path(__file__).resolve().parents[1]
CAPTURE_SCRIPT = ROOT / "scripts" / "capture-real-preview-videos.py"
SWIFT_TOOL = ROOT / "scripts" / "live-photo-tool.swift"
PREVIEW_ROOT = ROOT / "demo" / "preview-demos"
MANIFEST_PATH = PREVIEW_ROOT / "preview-manifest.json"
OUTPUT_ROOT = ROOT / "demo" / "live-photos"
VIEWPORT_WIDTH = 320
VIEWPORT_HEIGHT = 180
CAPTURE_SCALE = 4
CAPTURE_FPS = 12
MOVIE_FPS = 30
DURATION_SECONDS = 3
OUTPUT_WIDTH = 1080
OUTPUT_HEIGHT = 1920

RECOMMENDED_EFFECTS = {
    "liquid-chrome-letterform": {
        "name": "Liquid chrome letterform",
        "nameZh": "液态铬金属字形",
        "score": 96,
        "reasonZh": "WebGL 材质、高光和字形切换在短时动态里辨识度最高。",
    },
    "flow-field-ribbon-advection": {
        "name": "Flow field ribbon advection",
        "nameZh": "流场带状平流",
        "score": 93,
        "reasonZh": "流线、航线与探针共同展示连续场动画和数据叙事。",
    },
    "recursive-arc-forest-growth": {
        "name": "Recursive arc forest growth",
        "nameZh": "递归弧线森林生长",
        "score": 96,
        "reasonZh": "递归树冠的生长变化适合用按压即播放的 Live Photo 表达。",
    },
    "velocity-reactive-marquee": {
        "name": "Velocity-reactive marquee",
        "nameZh": "速度响应跑马灯",
        "score": 93,
        "reasonZh": "覆盖 DOM、速度、方向反转和有限惯性，补足非 Canvas 类型。",
    },
    "poisson-constellation-bloom": {
        "name": "Poisson constellation bloom",
        "nameZh": "泊松星座绽放",
        "score": 90,
        "reasonZh": "节点关系与局部风险查询在三秒内具有清晰的状态变化。",
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--only",
        help="Comma-separated effect ids; defaults to the five recommended demos",
    )
    parser.add_argument(
        "--output-root",
        type=Path,
        default=OUTPUT_ROOT,
        help="Destination for .pvt packages and manifest.json",
    )
    parser.add_argument(
        "--headed",
        action="store_true",
        help="Show Chrome while capturing",
    )
    parser.add_argument(
        "--keep-frames",
        action="store_true",
        help="Retain high-resolution captured PNG frames under the output root",
    )
    return parser.parse_args()


def require_command(name: str) -> str:
    path = shutil.which(name)
    if not path:
        raise RuntimeError(f"Required command is missing: {name}")
    return path


def load_capture_module():
    spec = importlib.util.spec_from_file_location("real_preview_capture", CAPTURE_SCRIPT)
    if not spec or not spec.loader:
        raise RuntimeError(f"Unable to load {CAPTURE_SCRIPT}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def stable_asset_identifier(effect_id: str) -> str:
    namespace = "https://github.com/giraffe-tree/awesome-web-effects/live-photo/v1/"
    return str(uuid.uuid5(uuid.NAMESPACE_URL, namespace + effect_id)).upper()


def encode_portrait_movie(frame_root: Path, output: Path) -> None:
    filter_graph = (
        "[0:v]split[background][foreground];"
        f"[background]scale={OUTPUT_WIDTH}:{OUTPUT_HEIGHT}:"
        "force_original_aspect_ratio=increase,"
        f"crop={OUTPUT_WIDTH}:{OUTPUT_HEIGHT},"
        "gblur=sigma=42,eq=brightness=-0.18:saturation=0.82[backdrop];"
        f"[foreground]scale={OUTPUT_WIDTH}:-2[stage];"
        "[backdrop][stage]overlay=(W-w)/2:(H-h)/2,"
        "setsar=1,format=yuv420p"
    )
    subprocess.run(
        [
            require_command("ffmpeg"),
            "-hide_banner",
            "-loglevel",
            "error",
            "-framerate",
            str(CAPTURE_FPS),
            "-i",
            str(frame_root / "%04d.png"),
            "-vf",
            filter_graph,
            "-t",
            str(DURATION_SECONDS),
            "-r",
            str(MOVIE_FPS),
            "-c:v",
            "libx264",
            "-profile:v",
            "high",
            "-level",
            "4.1",
            "-crf",
            "18",
            "-preset",
            "medium",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            "-an",
            "-y",
            str(output),
        ],
        check=True,
    )


def extract_key_photo(movie: Path, output: Path) -> None:
    subprocess.run(
        [
            require_command("ffmpeg"),
            "-hide_banner",
            "-loglevel",
            "error",
            "-ss",
            str(DURATION_SECONDS / 2),
            "-i",
            str(movie),
            "-frames:v",
            "1",
            "-q:v",
            "2",
            "-y",
            str(output),
        ],
        check=True,
    )


def package_and_validate(
    effect_id: str,
    photo: Path,
    movie: Path,
    staging_root: Path,
) -> tuple[Path, str]:
    asset_identifier = stable_asset_identifier(effect_id)
    staged_package = staging_root / f"{effect_id}.pvt"
    subprocess.run(
        [
            require_command("xcrun"),
            "swift",
            str(SWIFT_TOOL),
            "package",
            str(photo),
            str(movie),
            str(staged_package),
            asset_identifier,
        ],
        check=True,
    )
    packaged_photo = staged_package / photo.name
    packaged_movie = staged_package / movie.name
    subprocess.run(
        [
            require_command("xcrun"),
            "swift",
            str(SWIFT_TOOL),
            "validate",
            str(packaged_photo),
            str(packaged_movie),
        ],
        check=True,
    )
    return staged_package, asset_identifier


def replace_package(staged_package: Path, destination: Path) -> None:
    if destination.exists():
        shutil.rmtree(destination)
    shutil.move(str(staged_package), str(destination))


def main() -> int:
    args = parse_args()
    output_root = args.output_root.resolve()
    requested = [
        item
        for item in (args.only.split(",") if args.only else RECOMMENDED_EFFECTS)
        if item
    ]
    unknown = set(requested) - set(RECOMMENDED_EFFECTS)
    if unknown:
        raise RuntimeError(f"Unknown recommended effect id(s): {', '.join(sorted(unknown))}")

    capture = load_capture_module()
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as error:
        raise RuntimeError("Python Playwright is required") from error

    manifest = json.loads(MANIFEST_PATH.read_text())
    demos_by_id = {demo["id"]: demo for demo in manifest["demos"]}
    missing = set(requested) - set(demos_by_id)
    if missing:
        raise RuntimeError(f"Preview manifest is missing: {', '.join(sorted(missing))}")
    if not (PREVIEW_ROOT / "dist" / f"{requested[0]}.html").exists():
        raise RuntimeError(
            f"Built demos are absent. Run: npm run build --prefix {PREVIEW_ROOT}"
        )

    output_root.mkdir(parents=True, exist_ok=True)
    retained_frames = output_root / "frames"
    if args.keep_frames:
        retained_frames.mkdir(exist_ok=True)

    port = capture.available_port()
    base_url = f"http://127.0.0.1:{port}"
    with tempfile.TemporaryDirectory(prefix="live-photo-build-") as temporary:
        temporary_root = Path(temporary)
        log_path = temporary_root / "vite.log"
        with log_path.open("w") as log_handle:
            server = subprocess.Popen(
                [
                    str(PREVIEW_ROOT / "node_modules" / ".bin" / "vite"),
                    "preview",
                    "--host",
                    "127.0.0.1",
                    "--port",
                    str(port),
                    "--strictPort",
                    "--logLevel",
                    "silent",
                ],
                cwd=PREVIEW_ROOT,
                stdout=log_handle,
                stderr=subprocess.STDOUT,
            )

        records = []
        try:
            first_url = f"{base_url}/{requested[0]}.html"
            capture.wait_for_server(first_url, server, log_path)
            capture_args = SimpleNamespace(
                duration=DURATION_SECONDS,
                fps=CAPTURE_FPS,
                height=VIEWPORT_HEIGHT,
                playback_fps=CAPTURE_FPS,
                capture_scale=CAPTURE_SCALE,
                width=VIEWPORT_WIDTH,
            )
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(
                    executable_path=capture.chrome_path(),
                    headless=not args.headed,
                    args=[
                        "--use-angle=metal",
                        "--ignore-gpu-blocklist",
                        "--enable-webgl",
                    ],
                )
                context = browser.new_context(
                    viewport={
                        "width": VIEWPORT_WIDTH,
                        "height": VIEWPORT_HEIGHT,
                    },
                    device_scale_factor=1,
                    reduced_motion="no-preference",
                )
                for effect_id in requested:
                    demo = demos_by_id[effect_id]
                    effect_root = temporary_root / effect_id
                    high_resolution_frames = effect_root / "high-resolution"
                    page = context.new_page()
                    try:
                        frame_count, unique_count, _ = capture.capture_demo(
                            page,
                            f"{base_url}/{effect_id}.html",
                            demo,
                            high_resolution_frames,
                            capture_args,
                        )
                    finally:
                        page.close()

                    movie = effect_root / f"{effect_id}.mov"
                    photo = effect_root / f"{effect_id}.jpg"
                    encode_portrait_movie(high_resolution_frames, movie)
                    extract_key_photo(movie, photo)
                    staged_package, asset_identifier = package_and_validate(
                        effect_id,
                        photo,
                        movie,
                        effect_root,
                    )
                    destination = output_root / staged_package.name
                    replace_package(staged_package, destination)
                    if args.keep_frames:
                        frame_destination = retained_frames / effect_id
                        if frame_destination.exists():
                            shutil.rmtree(frame_destination)
                        shutil.copytree(high_resolution_frames, frame_destination)

                    details = RECOMMENDED_EFFECTS[effect_id]
                    records.append(
                        {
                            "effectId": effect_id,
                            "name": details["name"],
                            "nameZh": details["nameZh"],
                            "curationScore": details["score"],
                            "recommendationZh": details["reasonZh"],
                            "sourceType": "real-browser-demo",
                            "sourceDemoPath": f"demo/preview-demos/{effect_id}.html",
                            "packagePath": f"demo/live-photos/{effect_id}.pvt",
                            "photoPath": (
                                f"demo/live-photos/{effect_id}.pvt/{effect_id}.jpg"
                            ),
                            "videoPath": (
                                f"demo/live-photos/{effect_id}.pvt/{effect_id}.mov"
                            ),
                            "assetIdentifier": asset_identifier,
                            "frameCount": frame_count,
                            "uniqueFrameCount": unique_count,
                            "validation": "PHLivePhoto-full-nondegraded",
                        }
                    )
                    print(
                        f"Built {effect_id}: {frame_count} frames, "
                        f"{unique_count} unique, {destination}",
                        flush=True,
                    )
                context.close()
                browser.close()
        finally:
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait()

    output_manifest_path = output_root / "manifest.json"
    if args.only and output_manifest_path.exists():
        previous_manifest = json.loads(output_manifest_path.read_text())
        previous_records = {
            record["effectId"]: record
            for record in previous_manifest.get("records", [])
            if record.get("effectId") not in requested
        }
        previous_records.update({record["effectId"]: record for record in records})
        records = [
            previous_records[effect_id]
            for effect_id in RECOMMENDED_EFFECTS
            if effect_id in previous_records
        ]

    output_manifest = {
        "schemaVersion": 1,
        "generatedAt": date.today().isoformat(),
        "format": {
            "container": "pvt",
            "photo": "JPEG",
            "video": "QuickTime MOV / H.264",
            "width": OUTPUT_WIDTH,
            "height": OUTPUT_HEIGHT,
            "durationSeconds": DURATION_SECONDS,
            "movieFps": MOVIE_FPS,
            "audio": False,
        },
        "capture": {
            "viewport": f"{VIEWPORT_WIDTH}x{VIEWPORT_HEIGHT}",
            "captureScale": CAPTURE_SCALE,
            "sourceFrameFps": CAPTURE_FPS,
            "interactionDriver": "scripts/capture-real-preview-videos.py",
        },
        "records": records,
    }
    output_manifest_path.write_text(
        json.dumps(output_manifest, ensure_ascii=False, indent=2) + "\n"
    )
    print(
        f"Built {len(requested)} and indexed {len(records)} Live Photo packages "
        f"under {output_root}"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, subprocess.CalledProcessError) as error:
        print(f"build-live-photo-demos: {error}")
        raise SystemExit(1)
