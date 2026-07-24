#!/usr/bin/env python3
"""Build a six-slide Xiaohongshu carousel for Awesome Web Effects."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
BG_DIR = HERE / "backgrounds"
W, H = 1242, 1656

FONT_CJK = "/System/Library/Fonts/Hiragino Sans GB.ttc"
FONT_SANS = "/System/Library/Fonts/SFNS.ttf"
FONT_MONO = "/System/Library/Fonts/SFNSMono.ttf"

IVORY = (248, 245, 238)
MUTED = (186, 190, 207)
PINK = (237, 165, 185)
PINK_DARK = (49, 24, 42)
PERI = (157, 173, 225)
LIME = (198, 244, 91)
INK = (8, 13, 34)


def font(size: int, bold: bool = False, mono: bool = False) -> ImageFont.FreeTypeFont:
    if mono:
        return ImageFont.truetype(FONT_MONO, size=size)
    if bold:
        return ImageFont.truetype(FONT_CJK, size=size, index=2)
    return ImageFont.truetype(FONT_CJK, size=size, index=0)


def cover(im: Image.Image, size: tuple[int, int]) -> Image.Image:
    im = im.convert("RGB")
    scale = max(size[0] / im.width, size[1] / im.height)
    resized = im.resize((round(im.width * scale), round(im.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - size[0]) // 2
    top = (resized.height - size[1]) // 2
    return resized.crop((left, top, left + size[0], top + size[1]))


def contain(im: Image.Image, size: tuple[int, int]) -> Image.Image:
    im = im.convert("RGB")
    scale = min(size[0] / im.width, size[1] / im.height)
    return im.resize((round(im.width * scale), round(im.height * scale)), Image.Resampling.LANCZOS)


def gradient_overlay(
    base: Image.Image,
    top_alpha: int = 190,
    bottom_alpha: int = 25,
    start: float = 0.0,
    end: float = 1.0,
) -> None:
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    px = overlay.load()
    start_y, end_y = int(H * start), int(H * end)
    span = max(1, end_y - start_y)
    for y in range(H):
        if y <= start_y:
            a = top_alpha
        elif y >= end_y:
            a = bottom_alpha
        else:
            t = (y - start_y) / span
            a = round(top_alpha + (bottom_alpha - top_alpha) * t)
        for x in range(W):
            px[x, y] = (4, 8, 26, a)
    base.alpha_composite(overlay)


def add_vignette(base: Image.Image, strength: int = 105) -> None:
    mask = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(mask)
    margin = 180
    d.ellipse((-margin, -margin, W + margin, H + margin), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(180))
    inv = Image.eval(mask, lambda p: int((255 - p) * strength / 255))
    layer = Image.new("RGBA", (W, H), (1, 4, 18, 0))
    layer.putalpha(inv)
    base.alpha_composite(layer)


def rounded_crop(im: Image.Image, size: tuple[int, int], radius: int) -> Image.Image:
    fitted = cover(im, size).convert("RGBA")
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    fitted.putalpha(mask)
    return fitted


def paste_with_shadow(
    base: Image.Image,
    im: Image.Image,
    xy: tuple[int, int],
    radius: int = 36,
    shadow: int = 36,
    border: tuple[int, int, int, int] = (197, 173, 224, 90),
) -> None:
    x, y = xy
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width, im.height), radius=radius, fill=255)
    sh = Image.new("RGBA", (im.width + shadow * 2, im.height + shadow * 2), (0, 0, 0, 0))
    sh_mask = Image.new("L", sh.size, 0)
    ImageDraw.Draw(sh_mask).rounded_rectangle(
        (shadow, shadow, shadow + im.width, shadow + im.height), radius=radius, fill=180
    )
    sh_mask = sh_mask.filter(ImageFilter.GaussianBlur(shadow // 2))
    sh.putalpha(sh_mask)
    black = Image.new("RGBA", sh.size, (0, 0, 0, 160))
    black.putalpha(sh_mask)
    base.alpha_composite(black, (x - shadow, y - shadow + 18))

    tile = im.convert("RGBA")
    tile.putalpha(mask)
    base.alpha_composite(tile, (x, y))
    d = ImageDraw.Draw(base)
    d.rounded_rectangle((x, y, x + im.width, y + im.height), radius=radius, outline=border, width=2)


def text(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    value: str,
    size: int,
    fill=IVORY,
    bold: bool = False,
    spacing: int = 10,
    mono: bool = False,
    anchor: str | None = None,
    stroke_width: int = 0,
    stroke_fill=(0, 0, 0),
) -> None:
    draw.multiline_text(
        xy,
        value,
        font=font(size, bold=bold, mono=mono),
        fill=fill,
        spacing=spacing,
        anchor=anchor,
        stroke_width=stroke_width,
        stroke_fill=stroke_fill,
    )


def pill(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    label: str,
    size: int = 26,
    fg=IVORY,
    bg=(21, 25, 57, 220),
    outline=(237, 165, 185, 100),
    pad_x: int = 22,
    pad_y: int = 13,
) -> tuple[int, int, int, int]:
    f = font(size, bold=True)
    box = draw.textbbox((0, 0), label, font=f)
    w = box[2] - box[0] + pad_x * 2
    h = box[3] - box[1] + pad_y * 2
    x, y = xy
    draw.rounded_rectangle((x, y, x + w, y + h), radius=h // 2, fill=bg, outline=outline, width=2)
    draw.text((x + pad_x, y + pad_y - box[1]), label, font=f, fill=fg)
    return x, y, x + w, y + h


def brand(draw: ImageDraw.ImageDraw, page: int) -> None:
    x, y = 76, 68
    draw.rounded_rectangle((x, y, x + 56, y + 56), radius=18, fill=PINK)
    text(draw, (x + 28, y + 29), "AW", 22, fill=PINK_DARK, bold=True, anchor="mm")
    text(draw, (x + 76, y + 8), "Awesome Web Effects", 25, fill=IVORY, bold=True)
    text(draw, (x + 76, y + 38), "开源 Web 交互图鉴", 17, fill=MUTED)
    text(draw, (W - 78, y + 17), f"{page:02d} / 06", 18, fill=MUTED, mono=True, anchor="ra")


def footer(draw: ImageDraw.ImageDraw, accent=PINK) -> None:
    draw.line((76, H - 74, 172, H - 74), fill=accent, width=3)
    text(draw, (194, H - 88), "giraffe-tree.github.io/awesome-web-effects", 17, fill=MUTED, mono=True)


def new_slide(bg_name: str, top_alpha: int = 185, bottom_alpha: int = 30) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    base = cover(Image.open(BG_DIR / bg_name), (W, H)).convert("RGBA")
    base = ImageEnhance.Color(base).enhance(0.88)
    gradient_overlay(base, top_alpha=top_alpha, bottom_alpha=bottom_alpha, start=0, end=0.72)
    add_vignette(base)
    return base, ImageDraw.Draw(base)


def slide_1() -> Image.Image:
    base, d = new_slide("01-cover.png", top_alpha=170, bottom_alpha=8)
    brand(d, 1)
    text(d, (76, 203), "THE EFFECT-FIRST INTERACTION ATLAS", 18, fill=PINK, bold=True, mono=True)
    d.line((76, 188, 132, 188), fill=PINK, width=3)
    text(d, (70, 274), "不知道特效\n叫什么？\n先看见它。", 112, bold=True, spacing=-5)
    text(d, (78, 706), "先看真实效果，再知道它叫什么，\n最后复制代码或 Agent 提示词。", 33, fill=(216, 214, 225), spacing=15)
    pill(d, (78, 866), "150 个真实动效", size=28, fg=PINK_DARK, bg=(237, 165, 185, 245), outline=(255, 222, 230, 160), pad_x=28, pad_y=16)
    pill(d, (356, 866), "每项 ≥ 80 分", size=28, fg=IVORY, bg=(25, 27, 62, 210), outline=(157, 173, 225, 100), pad_x=28, pad_y=16)
    footer(d)
    return base


def slide_2() -> Image.Image:
    base, d = new_slide("02-problem.png", top_alpha=198, bottom_alpha=38)
    brand(d, 2)
    text(d, (76, 205), "脑子里有感觉，\n却搜不到关键词", 88, bold=True, spacing=5)
    text(d, (80, 426), "想要“滚动时钉住页面”“鼠标划过有液体感”……\n但不知道特效叫什么，就很难找对实现。", 30, fill=(213, 212, 225), spacing=13)

    card = (72, 598, 1170, 872)
    d.rounded_rectangle(card, radius=38, fill=(10, 14, 38, 190), outline=(237, 165, 185, 80), width=2)
    text(d, (108, 636), "“", 62, fill=PINK, bold=True)
    text(d, (158, 648), "我记得它长什么样，\n但我不知道该搜什么。", 44, bold=True, spacing=10)
    text(d, (108, 796), "这正是 Awesome Web Effects 想解决的问题。", 23, fill=MUTED)

    pill(d, (76, 1118), "搜描述", size=24, bg=(18, 23, 55, 220), outline=(157, 173, 225, 100))
    text(d, (256, 1134), "→", 27, fill=PINK, bold=True)
    pill(d, (308, 1118), "猜关键词", size=24, bg=(18, 23, 55, 220), outline=(157, 173, 225, 100))
    text(d, (514, 1134), "→", 27, fill=PINK, bold=True)
    pill(d, (566, 1118), "翻仓库", size=24, bg=(18, 23, 55, 220), outline=(157, 173, 225, 100))

    d.rounded_rectangle((72, 1270, 1170, 1450), radius=36, fill=(237, 165, 185, 230))
    text(d, (110, 1304), "把“搜名字”变成“看效果”", 46, fill=PINK_DARK, bold=True)
    text(d, (112, 1373), "先用眼睛找，再带走可靠实现。", 26, fill=(80, 43, 65))
    footer(d, accent=IVORY)
    return base


def slide_3() -> Image.Image:
    base, d = new_slide("03-flow.png", top_alpha=198, bottom_alpha=70)
    brand(d, 3)
    text(d, (76, 198), "看见 → 叫出 → 实现", 76, bold=True)
    text(d, (80, 305), "不用先懂库名，也不用先会技术术语。", 30, fill=(214, 214, 228))

    shot = Image.open(REPO / "tmp/pink-dawn-desktop-hero-v2.png")
    shot = cover(shot, (1086, 624))
    paste_with_shadow(base, shot, (78, 410), radius=34, shadow=44)

    stages = [
        ("01", "浏览真实预览", "直接看效果，不先猜名字"),
        ("02", "查看评分与代码", "看来源、门槛与最小实现"),
        ("03", "复制 Agent Prompt", "把完整任务交给编程 Agent"),
    ]
    for i, (n, title, sub) in enumerate(stages):
        x = 76 + i * 366
        y = 1112
        d.rounded_rectangle((x, y, x + 342, y + 240), radius=30, fill=(12, 17, 44, 218), outline=(157, 173, 225, 65), width=2)
        text(d, (x + 24, y + 22), n, 19, fill=PINK, bold=True, mono=True)
        text(d, (x + 24, y + 70), title, 29, bold=True)
        text(d, (x + 24, y + 123), sub, 20, fill=MUTED, spacing=8)
        d.line((x + 24, y + 194, x + 102, y + 194), fill=PINK if i != 2 else LIME, width=4)
    footer(d)
    return base


def metric_label(draw: ImageDraw.ImageDraw, center: tuple[int, int], big: str, small: str, accent=PINK) -> None:
    x, y = center
    draw.rounded_rectangle((x - 132, y - 91, x + 132, y + 95), radius=28, fill=(7, 11, 31, 190), outline=(248, 245, 238, 55), width=2)
    text(draw, (x, y - 58), big, 68, fill=accent, bold=True, anchor="ma")
    text(draw, (x, y + 35), small, 24, fill=IVORY, bold=True, anchor="mm")


def slide_4() -> Image.Image:
    base, d = new_slide("04-proof.png", top_alpha=206, bottom_alpha=20)
    brand(d, 4)
    text(d, (76, 196), "不是链接堆砌，\n每一个都要过门槛", 80, bold=True, spacing=5)
    text(d, (80, 409), "真实预览 · 可追溯来源 · 最小代码 · 人工策展评分", 27, fill=(214, 214, 228))
    pill(d, (80, 477), "只发布 80 分以上", size=24, fg=PINK_DARK, bg=(237, 165, 185, 240), outline=(255, 255, 255, 90))

    metric_label(d, (210, 866), "150", "入选效果", PINK)
    metric_label(d, (642, 925), "152", "真实视频", PERI)
    metric_label(d, (504, 1252), "148", "可运行 Demo", IVORY)
    metric_label(d, (986, 1128), "≥80", "策展准入分", LIME)
    text(d, (82, 1472), "每个效果都能从预览追到 Demo、代码和出处。", 25, fill=(217, 216, 229))
    footer(d)
    return base


def preview_poster(path: Path) -> Image.Image:
    return Image.open(path).convert("RGB")


def preview_tile(base: Image.Image, item: tuple[str, str], box: tuple[int, int, int, int]) -> None:
    preview_name, label = item
    x1, y1, x2, y2 = box
    frame = preview_poster(REPO / "demo/videos/posters" / f"{preview_name}.webp")
    tile = rounded_crop(frame, (x2 - x1, y2 - y1), 28)
    base.alpha_composite(tile, (x1, y1))
    shade = Image.new("RGBA", (x2 - x1, 78), (5, 8, 25, 178))
    base.alpha_composite(shade, (x1, y2 - 78))
    d = ImageDraw.Draw(base)
    d.rounded_rectangle((x1, y1, x2, y2), radius=28, outline=(248, 245, 238, 65), width=2)
    text(d, (x1 + 18, y2 - 57), label, 21, bold=True)


def slide_5() -> Image.Image:
    base, d = new_slide("05-categories.png", top_alpha=215, bottom_alpha=92)
    brand(d, 5)
    text(d, (76, 194), "一个库，7 种视觉语言", 78, bold=True)
    text(d, (80, 305), "从微交互到 WebGL，把“好看”拆成能落地的效果。", 29, fill=(217, 216, 229))

    items = [
        ("spring-loaded-split-flap-counter", "动画与编排"),
        ("pinned-horizontal-scroll-scene", "滚动与揭示"),
        ("filterable-grid-reflow", "页面与布局"),
        ("perspective-tilt-and-glare", "指针与悬停"),
        ("liquid-chrome-letterform", "文本与 SVG"),
        ("magnetic-pixel-sort-field", "Canvas 与 2D"),
        ("pointer-injected-gpu-fluid", "3D 与 WebGL"),
    ]
    gap = 22
    y1, h1 = 430, 360
    w1 = (W - 152 - gap * 2) // 3
    for i, item in enumerate(items[:3]):
        x = 76 + i * (w1 + gap)
        preview_tile(base, item, (x, y1, x + w1, y1 + h1))

    y2, h2 = 830, 390
    w2 = (W - 152 - gap * 3) // 4
    for i, item in enumerate(items[3:]):
        x = 76 + i * (w2 + gap)
        preview_tile(base, item, (x, y2, x + w2, y2 + h2))

    d.rounded_rectangle((76, 1272, 1166, 1458), radius=34, fill=(10, 14, 38, 210), outline=(237, 165, 185, 70), width=2)
    text(d, (112, 1307), "不是概念图：每一格都来自真实录制", 38, bold=True)
    text(d, (114, 1371), "150 个效果，按视觉类型浏览，点开就能看实现。", 25, fill=MUTED)
    footer(d)
    return base


def slide_6() -> Image.Image:
    base, d = new_slide("06-cta.png", top_alpha=196, bottom_alpha=35)
    brand(d, 6)
    text(d, (76, 194), "把喜欢的效果，\n直接交给 Agent 实现", 82, bold=True, spacing=5)
    text(d, (80, 412), "查看真实 Demo → 复制最小代码 → 一键复制完整 Prompt", 27, fill=(217, 216, 229))

    shot = Image.open(REPO / "tmp/catalog-detail-desktop.png")
    shot = cover(shot, (1060, 610))
    shot = ImageEnhance.Brightness(shot).enhance(0.92)
    paste_with_shadow(base, shot, (91, 530), radius=34, shadow=40, border=(237, 165, 185, 110))

    d.rounded_rectangle((78, 1212, 1164, 1450), radius=40, fill=(237, 165, 185, 238), outline=(255, 232, 238, 120), width=2)
    text(d, (116, 1250), "去 GitHub 收藏这个项目", 46, fill=PINK_DARK, bold=True)
    text(d, (118, 1323), "github.com/giraffe-tree/awesome-web-effects", 23, fill=(74, 43, 64), mono=True)
    pill(d, (840, 1262), "开源 · 可复制", size=22, fg=IVORY, bg=(41, 28, 62, 235), outline=(41, 28, 62, 0), pad_x=22, pad_y=13)
    footer(d, accent=IVORY)
    return base


def save(slide: Image.Image, filename: str) -> None:
    out = HERE / filename
    rgb = slide.convert("RGB")
    rgb.save(out, "JPEG", quality=95, subsampling=0, optimize=True, progressive=True)
    print(f"saved {out} ({rgb.width}x{rgb.height})")


def contact_sheet(images: list[Image.Image]) -> None:
    thumb_w, thumb_h = 310, 414
    sheet = Image.new("RGB", (thumb_w * 3 + 32 * 4, thumb_h * 2 + 32 * 3), (10, 13, 28))
    for i, im in enumerate(images):
        thumb = cover(im, (thumb_w, thumb_h))
        x = 32 + (i % 3) * (thumb_w + 32)
        y = 32 + (i // 3) * (thumb_h + 32)
        sheet.paste(thumb.convert("RGB"), (x, y))
    sheet.save(HERE / "contact-sheet.jpg", "JPEG", quality=92, subsampling=0, optimize=True)


def main() -> None:
    slides = [slide_1(), slide_2(), slide_3(), slide_4(), slide_5(), slide_6()]
    names = [
        "01-cover.jpg",
        "02-problem.jpg",
        "03-see-name-build.jpg",
        "04-curation-proof.jpg",
        "05-seven-categories.jpg",
        "06-cta.jpg",
    ]
    for image, name in zip(slides, names, strict=True):
        save(image, name)
    contact_sheet(slides)
    print(f"saved {HERE / 'contact-sheet.jpg'}")


if __name__ == "__main__":
    main()
