#!/usr/bin/env python3
"""Transcode verified official preview media into local MP4 videos and posters."""

from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PROVENANCE_PATH = ROOT / "demo" / "videos" / "provenance.json"
WIDTH = 640
HEIGHT = 360
DURATION = 7.2


def require_command(name: str) -> str:
    path = shutil.which(name)
    if not path:
        raise RuntimeError(f"Required command is missing: {name}")
    return path


def downloadable_url(url: str) -> str:
    prefix = "https://github.com/"
    if url.startswith(prefix) and "/blob/" in url:
        owner_repo, revision_path = url[len(prefix):].split("/blob/", 1)
        return f"https://raw.githubusercontent.com/{owner_repo}/{revision_path}"
    return url


def legacy_gif_for(record: dict) -> Path:
    stem = Path(record["outputPath"]).stem
    return ROOT / "demo" / "gifs" / f"{stem}.gif"


def source_media(record: dict, temporary_root: Path) -> Path:
    legacy = legacy_gif_for(record)
    if legacy.is_file():
        return legacy
    downloaded = temporary_root / f"{record['effectId']}.gif"
    urllib.request.urlretrieve(downloadable_url(record["originUrl"]), downloaded)
    return downloaded


def encode_video(source: Path, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            require_command("ffmpeg"), "-hide_banner", "-loglevel", "error",
            "-stream_loop", "-1", "-i", str(source),
            "-t", str(DURATION), "-an",
            "-vf",
            (
                f"fps=30,scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease:"
                "flags=lanczos,"
                f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p"
            ),
            "-c:v", "libx264", "-preset", "slow", "-crf", "23",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            "-map_metadata", "-1", "-map_chapters", "-1", "-y", str(output),
        ],
        check=True,
    )


def encode_poster(source: Path, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        frame = image.convert("RGB")
        fitted = ImageOps.contain(frame, (WIDTH, HEIGHT), method=Image.Resampling.LANCZOS)
        poster = Image.new("RGB", (WIDTH, HEIGHT), "black")
        poster.paste(fitted, ((WIDTH - fitted.width) // 2, (HEIGHT - fitted.height) // 2))
        poster.save(output, format="WEBP", quality=82, method=6)


def main() -> int:
    manifest = json.loads(PROVENANCE_PATH.read_text())
    records = [record for record in manifest["records"] if record["sourceType"] == "official"]
    with tempfile.TemporaryDirectory(prefix="official-preview-video-") as temporary:
        temporary_root = Path(temporary)
        for record in records:
            source = source_media(record, temporary_root)
            video = ROOT / record["outputPath"]
            poster = ROOT / record["posterPath"]
            encode_video(source, video)
            encode_poster(source, poster)
            print(
                f"Transcoded {record['effectId']}: "
                f"{video.relative_to(ROOT)} ({video.stat().st_size / 1024:.1f} KiB), "
                f"{poster.relative_to(ROOT)} ({poster.stat().st_size / 1024:.1f} KiB)"
            )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, subprocess.CalledProcessError) as error:
        print(f"transcode-official-preview-videos: {error}")
        raise SystemExit(1)
