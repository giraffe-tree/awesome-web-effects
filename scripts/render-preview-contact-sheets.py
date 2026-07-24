#!/usr/bin/env python3
"""Render paginated, labeled contact sheets from captured preview videos.

The script is intentionally read-only with respect to source videos. It uses the
expansion plan for batch membership and writes generated PNG pages under tmp/.
"""

from __future__ import annotations

import argparse
from io import BytesIO
import json
import math
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, NoReturn, Sequence

try:
    from PIL import Image, ImageDraw, ImageFont, ImageOps, UnidentifiedImageError
except ImportError as error:  # pragma: no cover - environment-specific guidance
    raise SystemExit(
        "Pillow is required. Install it with `python3 -m pip install Pillow`."
    ) from error


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PLAN = REPO_ROOT / "research" / "effect-expansion-100-plan-2026-07-20.json"
DEFAULT_VIDEO_DIR = REPO_ROOT / "demo" / "videos" / "captured"
DEFAULT_OUTPUT_DIR = REPO_ROOT / "tmp" / "preview-contact-sheets"

BATCHES = ("A", "B", "C")
EFFECTS_PER_PAGE = 9
PAGE_COLUMNS = 3

FRAME_WIDTH = 320
FRAME_HEIGHT = 180
FRAME_GAP = 8
CELL_PADDING = 10
LABEL_HEIGHT = 38
CELL_WIDTH = FRAME_WIDTH * 2 + FRAME_GAP + CELL_PADDING * 2
CELL_HEIGHT = LABEL_HEIGHT + FRAME_HEIGHT * 2 + FRAME_GAP + CELL_PADDING * 2

PAGE_MARGIN = 24
PAGE_GAP = 14
PAGE_HEADER_HEIGHT = 54

BACKGROUND = "#0b0c10"
CELL_BACKGROUND = "#17191f"
CELL_BORDER = "#373b47"
FRAME_BACKGROUND = "#050608"
LABEL_COLOR = "#f4f5f7"
SUBDUED_COLOR = "#aeb4c2"
SAMPLE_BADGE_BACKGROUND = "#000000"


@dataclass(frozen=True)
class PlannedEffect:
    id: str
    batch: str


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--plan",
        type=Path,
        default=DEFAULT_PLAN,
        help=f"Expansion-plan JSON to inspect (default: {DEFAULT_PLAN.relative_to(REPO_ROOT)}).",
    )
    parser.add_argument(
        "--batch",
        choices=(*BATCHES, "all"),
        default="all",
        help="Plan batch to render (default: all).",
    )
    parser.add_argument(
        "--only",
        metavar="ID1,ID2",
        help="Comma-separated stable IDs to render within the selected batch scope.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help=f"PNG destination (default: {DEFAULT_OUTPUT_DIR.relative_to(REPO_ROOT)}).",
    )
    return parser.parse_args(argv)


def fail(message: str) -> NoReturn:
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(2)


def load_plan(path: Path) -> list[PlannedEffect]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"plan JSON does not exist: {path}")
    except json.JSONDecodeError as error:
        fail(f"plan JSON is invalid at line {error.lineno}: {error.msg}")

    raw_effects = payload.get("effects") if isinstance(payload, dict) else None
    if not isinstance(raw_effects, list):
        fail(f"plan JSON must contain an `effects` array: {path}")

    effects: list[PlannedEffect] = []
    seen: set[str] = set()
    for index, record in enumerate(raw_effects):
        if not isinstance(record, dict):
            fail(f"plan effect at index {index} is not an object")
        effect_id = record.get("id")
        batch = record.get("batch")
        if not isinstance(effect_id, str) or not effect_id.strip():
            fail(f"plan effect at index {index} has no stable string ID")
        if batch not in BATCHES:
            fail(f"plan effect `{effect_id}` has unsupported batch `{batch}`")
        if effect_id in seen:
            fail(f"plan contains duplicate effect ID `{effect_id}`")
        seen.add(effect_id)
        effects.append(PlannedEffect(id=effect_id, batch=batch))

    if not effects:
        fail("plan contains no effects")
    return effects


def parse_only(value: str | None) -> list[str] | None:
    if value is None:
        return None
    ids = [item.strip() for item in value.split(",")]
    if not ids or any(not item for item in ids):
        fail("--only must be a comma-separated list of non-empty stable IDs")
    duplicates = sorted({item for item in ids if ids.count(item) > 1})
    if duplicates:
        fail(f"--only contains duplicate IDs: {', '.join(duplicates)}")
    return ids


def select_effects(
    effects: Sequence[PlannedEffect], batch: str, only: Sequence[str] | None
) -> list[PlannedEffect]:
    known = {effect.id: effect for effect in effects}
    if only:
        unknown = [effect_id for effect_id in only if effect_id not in known]
        if unknown:
            fail(f"--only IDs are absent from the plan: {', '.join(unknown)}")

    allowed_batches = set(BATCHES if batch == "all" else (batch,))
    if only:
        outside_scope = [
            effect_id for effect_id in only if known[effect_id].batch not in allowed_batches
        ]
        if outside_scope:
            fail(
                f"--only IDs are outside --batch {batch}: {', '.join(outside_scope)}"
            )
        requested = set(only)
        selected = [
            effect
            for effect in effects
            if effect.id in requested and effect.batch in allowed_batches
        ]
    else:
        selected = [effect for effect in effects if effect.batch in allowed_batches]

    if not selected:
        fail("the requested batch/ID selection contains no effects")
    return selected


def validate_videos(effects: Sequence[PlannedEffect], video_dir: Path) -> dict[str, Path]:
    video_paths = {effect.id: video_dir / f"{effect.id}.mp4" for effect in effects}
    missing = [path for path in video_paths.values() if not path.is_file()]
    if missing:
        rendered = "\n".join(f"  - {path.relative_to(REPO_ROOT)}" for path in missing)
        fail(
            f"{len(missing)} required video(s) are missing; no contact sheets were written:\n"
            f"{rendered}"
        )
    return video_paths


def load_font(size: int, *, bold: bool = False) -> ImageFont.ImageFont:
    names = (
        ("DejaVuSans-Bold.ttf", "Arial Bold.ttf")
        if bold
        else ("DejaVuSans.ttf", "Arial.ttf")
    )
    for name in names:
        try:
            return ImageFont.truetype(name, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def fit_label_font(draw: ImageDraw.ImageDraw, label: str, max_width: int) -> ImageFont.ImageFont:
    for size in range(22, 12, -1):
        font = load_font(size, bold=True)
        bounds = draw.textbbox((0, 0), label, font=font)
        if bounds[2] - bounds[0] <= max_width:
            return font
    return load_font(12, bold=True)


def normalize_frame(frame: Image.Image) -> Image.Image:
    rgba = frame.convert("RGBA")
    fitted = ImageOps.contain(
        rgba,
        (FRAME_WIDTH, FRAME_HEIGHT),
        method=Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", (FRAME_WIDTH, FRAME_HEIGHT), FRAME_BACKGROUND)
    offset = ((FRAME_WIDTH - fitted.width) // 2, (FRAME_HEIGHT - fitted.height) // 2)
    canvas.alpha_composite(fitted, offset)
    return canvas.convert("RGB")


def extract_samples(video_path: Path) -> list[tuple[str, Image.Image]]:
    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        raise RuntimeError("ffmpeg and ffprobe are required to sample preview videos")
    try:
        duration = float(subprocess.check_output(
            [
                ffprobe, "-v", "error", "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1", str(video_path),
            ],
            text=True,
        ).strip())
        samples: list[tuple[str, Image.Image]] = []
        for label, fraction in zip(("0%", "33%", "66%", "100%"), (0, .33, .66, .99)):
            frame_bytes = subprocess.check_output([
                ffmpeg, "-hide_banner", "-loglevel", "error",
                "-ss", f"{duration * fraction:.6f}", "-i", str(video_path),
                "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "pipe:1",
            ])
            with Image.open(BytesIO(frame_bytes)) as source:
                samples.append((label, normalize_frame(source.copy())))
        return samples
    except (OSError, subprocess.CalledProcessError, UnidentifiedImageError, ValueError) as error:
        raise RuntimeError(f"cannot sample video `{video_path}`: {error}") from error


def draw_sample_badge(
    draw: ImageDraw.ImageDraw, origin: tuple[int, int], label: str
) -> None:
    x, y = origin
    font = load_font(13, bold=True)
    bounds = draw.textbbox((0, 0), label, font=font)
    width = bounds[2] - bounds[0] + 14
    height = bounds[3] - bounds[1] + 8
    draw.rounded_rectangle(
        (x + 7, y + 7, x + 7 + width, y + 7 + height),
        radius=5,
        fill=SAMPLE_BADGE_BACKGROUND,
    )
    draw.text((x + 14, y + 10), label, fill=LABEL_COLOR, font=font)


def render_effect_cell(effect: PlannedEffect, video_path: Path) -> Image.Image:
    cell = Image.new("RGB", (CELL_WIDTH, CELL_HEIGHT), CELL_BACKGROUND)
    draw = ImageDraw.Draw(cell)
    draw.rectangle((0, 0, CELL_WIDTH - 1, CELL_HEIGHT - 1), outline=CELL_BORDER, width=1)

    label_font = fit_label_font(draw, effect.id, CELL_WIDTH - CELL_PADDING * 2)
    draw.text(
        (CELL_PADDING, CELL_PADDING + 1),
        effect.id,
        fill=LABEL_COLOR,
        font=label_font,
    )

    samples = extract_samples(video_path)
    frame_y = CELL_PADDING + LABEL_HEIGHT
    for index, (sample_label, frame) in enumerate(samples):
        column = index % 2
        row = index // 2
        x = CELL_PADDING + column * (FRAME_WIDTH + FRAME_GAP)
        y = frame_y + row * (FRAME_HEIGHT + FRAME_GAP)
        cell.paste(frame, (x, y))
        draw_sample_badge(draw, (x, y), sample_label)
    return cell


def chunks(items: Sequence[PlannedEffect], size: int) -> Iterable[Sequence[PlannedEffect]]:
    for start in range(0, len(items), size):
        yield items[start : start + size]


def display_path(path: Path) -> str:
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def render_page(
    batch: str,
    page_number: int,
    page_count: int,
    effects: Sequence[PlannedEffect],
    video_paths: dict[str, Path],
) -> Image.Image:
    rows = math.ceil(len(effects) / PAGE_COLUMNS)
    page_width = PAGE_MARGIN * 2 + CELL_WIDTH * PAGE_COLUMNS + PAGE_GAP * (PAGE_COLUMNS - 1)
    page_height = PAGE_MARGIN * 2 + PAGE_HEADER_HEIGHT + CELL_HEIGHT * rows + PAGE_GAP * (rows - 1)
    page = Image.new("RGB", (page_width, page_height), BACKGROUND)
    draw = ImageDraw.Draw(page)

    title_font = load_font(28, bold=True)
    meta_font = load_font(15)
    draw.text(
        (PAGE_MARGIN, PAGE_MARGIN),
        f"Preview QA · Batch {batch}",
        fill=LABEL_COLOR,
        font=title_font,
    )
    page_meta = f"page {page_number}/{page_count} · {len(effects)} effect(s) · 4 video samples each"
    meta_bounds = draw.textbbox((0, 0), page_meta, font=meta_font)
    draw.text(
        (page_width - PAGE_MARGIN - (meta_bounds[2] - meta_bounds[0]), PAGE_MARGIN + 9),
        page_meta,
        fill=SUBDUED_COLOR,
        font=meta_font,
    )

    grid_top = PAGE_MARGIN + PAGE_HEADER_HEIGHT
    for index, effect in enumerate(effects):
        column = index % PAGE_COLUMNS
        row = index // PAGE_COLUMNS
        x = PAGE_MARGIN + column * (CELL_WIDTH + PAGE_GAP)
        y = grid_top + row * (CELL_HEIGHT + PAGE_GAP)
        page.paste(render_effect_cell(effect, video_paths[effect.id]), (x, y))
    return page


def render_contact_sheets(
    effects: Sequence[PlannedEffect], video_paths: dict[str, Path], output_dir: Path
) -> list[Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for batch in BATCHES:
        batch_effects = [effect for effect in effects if effect.batch == batch]
        if not batch_effects:
            continue
        pages = list(chunks(batch_effects, EFFECTS_PER_PAGE))
        for page_index, page_effects in enumerate(pages, start=1):
            image = render_page(
                batch,
                page_index,
                len(pages),
                page_effects,
                video_paths,
            )
            output_path = output_dir / f"batch-{batch.lower()}-page-{page_index:02d}.png"
            image.save(output_path, format="PNG", optimize=True)
            written.append(output_path)
            print(
                f"wrote {display_path(output_path)} "
                f"({len(page_effects)} effects, {image.width}x{image.height})"
            )
    return written


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    effects = load_plan(args.plan)
    selected = select_effects(effects, args.batch, parse_only(args.only))
    video_paths = validate_videos(selected, DEFAULT_VIDEO_DIR)
    try:
        written = render_contact_sheets(selected, video_paths, args.output_dir.resolve())
    except RuntimeError as error:
        fail(str(error))
    print(f"rendered {len(written)} page(s) for {len(selected)} effect(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
