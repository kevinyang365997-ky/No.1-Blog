from __future__ import annotations

import csv
import re
import shutil
import unicodedata
from collections import defaultdict
from pathlib import Path

from PIL import Image, ImageOps


SOURCE = Path(r"C:\Users\123\Desktop\Southern Machinery Product Knowledge Base\标准内容")
BACKUP_ROOT = Path(r"C:\Users\123\Desktop\Southern Machinery Product Knowledge Base\博客图库")
ORIGINAL_BACKUP = BACKUP_ROOT / "原始图片备份"
SEO_BACKUP = BACKUP_ROOT / "SEO优化图片"
REPO = Path(r"C:\Users\123\Documents\ChatGPT\建立一个自己的博客网站\个人公司博客\personal-company-blog")
WEB_IMAGES = REPO / "all" / "image" / "gallery" / "equipment"
GALLERY = REPO / "gallery"
MANIFEST = BACKUP_ROOT / "图片SEO名称映射.csv"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tif", ".tiff", ".avif"}

CATEGORY_MAP = {
    "AOI": ("aoi-inspection", "SMT AOI Inspection Equipment", ["AOI", "SMT inspection"]),
    "feeder": ("smt-component-feeder", "SMT Component Feeder", ["SMT feeder", "component feeding"]),
    "Gripper Jaws": ("gripper-jaws", "Automation Gripper Jaws", ["gripper jaws", "automation tooling"]),
    "Insertion Machine": ("tht-insertion-machine", "THT Component Insertion Machine", ["THT insertion", "insertion machine"]),
    "Lead Forming & Cutting Machine": ("lead-forming-cutting-machine", "Component Lead Forming and Cutting Machine", ["lead forming", "component cutting"]),
    "Riveting Machine": ("automatic-riveting-machine", "Automatic Riveting Machine", ["riveting machine", "industrial automation"]),
    "Selective Soldering Machine": ("selective-soldering-machine", "Selective Soldering Machine", ["selective soldering", "THT soldering"]),
    "Taping Machine": ("component-taping-machine", "Electronic Component Taping Machine", ["taping machine", "component packaging"]),
    "X-RAY": ("smt-x-ray-inspection", "SMT X-Ray Inspection", ["X-Ray inspection", "BGA inspection"]),
    "接驳台": ("smt-pcb-conveyor", "SMT PCB Conveyor", ["PCB conveyor", "SMT production line"]),
    "料架": ("smt-reel-storage-rack", "SMT Reel Storage Rack", ["reel storage", "SMT material management"]),
    "选择性波峰焊": ("wave-selective-soldering", "Wave and Selective Soldering", ["wave soldering", "selective soldering"]),
    "配件": ("smt-machine-spare-parts", "SMT Machine Spare Parts", ["SMT spare parts", "machine parts"]),
}

NOISE = {
    "chatgpt", "image", "wechat", "weixin", "png", "jpg", "jpeg", "webp",
    "factory", "photo", "picture", "copy", "final", "new", "desktop",
}


def ascii_slug(value: str) -> str:
    lowered = value.lower()
    if lowered.startswith("chatgpt image") or value.startswith("微信图片"):
        return ""
    value = unicodedata.normalize("NFKD", value)
    value = value.replace("&", " and ")
    value = re.sub(r"\d{4}[年._-]\d{1,2}[月._-]\d{1,2}[^a-zA-Z0-9]*", " ", value)
    words = re.findall(r"[A-Za-z]+(?:[-]?[A-Za-z0-9]+)*|[A-Za-z]*\d+[A-Za-z0-9-]*", value)
    clean = []
    for word in words:
        token = re.sub(r"[^a-z0-9]+", "-", word.lower()).strip("-")
        token = {
            "botom": "bottom",
            "vibratorvbowl": "vibratory-bowl",
            "vibratorybowl": "vibratory-bowl",
            "tubefeeeder": "tube-feeder",
            "tubefeeder": "tube-feeder",
            "machineinstall": "machine-install",
            "stackedtube": "stacked-tube",
        }.get(token, token)
        if token.isdigit() and len(token) >= 6:
            continue
        if token and token not in NOISE and token not in clean:
            clean.append(token)
    return "-".join(clean[:8])


def detect_category(relative: Path):
    top = relative.parts[0] if len(relative.parts) > 1 else "其他"
    return CATEGORY_MAP.get(top, ("southern-machinery", "Southern Machinery Equipment", ["SMT equipment", "automation equipment"]))


def title_detail(stem: str, fallback_number: int) -> str:
    text = re.sub(r"(?i)chatgpt image.*$", "", stem)
    text = re.sub(r"微信图片[_\d-]*", "", text)
    text = re.sub(r"\s+", " ", text).strip(" _-—")
    ascii_text = " ".join(re.findall(r"[A-Za-z0-9]+(?:[-&][A-Za-z0-9]+)*", text))
    return ascii_text[:90].strip() or f"Product View {fallback_number:03d}"


def save_webp(source: Path, destination: Path) -> tuple[int, int]:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened)
        if getattr(image, "is_animated", False):
            image.seek(0)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")
        image.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
        if image.mode == "RGBA":
            background = Image.new("RGB", image.size, "white")
            background.paste(image, mask=image.getchannel("A"))
            image = background
        else:
            image = image.convert("RGB")
        image.save(destination, "WEBP", quality=82, method=6, optimize=True)
        return image.size


def write_gallery_item(path: Path, slug: str, title: str, image_url: str, alt: str, summary: str, tags: list[str], source_relative: str):
    tags_yaml = "\n".join(f"- {tag}" for tag in tags)
    body = f'''---
id: {slug}
title: "{title.replace('"', "'")}"
category: project
date: 2026-09-02
updated:
location: China
photographer: Southern Machinery
image: {image_url}
thumbnail: {image_url}
alt: "{alt.replace('"', "'")}"
summary: "{summary.replace('"', "'")}"
tags:
{tags_yaml}
related_projects:
related_articles:
featured: false
show: true
---

# Image Overview

{summary}

## Equipment Information

- Brand: Southern Machinery
- Category: {tags[0]}
- Image type: Product and equipment reference
- Source archive: `{source_relative}`

## Image Description

{alt}. This web image uses a descriptive filename, WebP compression and meaningful alternative text for faster loading and improved image search context.

## Usage

This image is part of the Southern Machinery product knowledge base and is published to support equipment selection, application research and SMT/THT automation project communication.

## Copyright

This image is maintained by Southern Machinery. Please obtain permission before reuse in external commercial materials.
'''
    path.write_text(body, encoding="utf-8", newline="\n")


def main():
    files = sorted(
        (p for p in SOURCE.rglob("*") if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS),
        key=lambda p: str(p.relative_to(SOURCE)).lower(),
    )
    # Clean only artifacts generated by this importer. Preserve original backups.
    for generated_dir, required_parent in ((SEO_BACKUP, BACKUP_ROOT), (WEB_IMAGES, REPO)):
        if generated_dir.exists():
            resolved = generated_dir.resolve()
            parent = required_parent.resolve()
            if parent not in resolved.parents:
                raise RuntimeError(f"Unsafe generated directory: {resolved}")
            shutil.rmtree(resolved)
    for generated_markdown in GALLERY.glob("southern-machinery-*.md"):
        generated_markdown.unlink()

    ORIGINAL_BACKUP.mkdir(parents=True, exist_ok=True)
    SEO_BACKUP.mkdir(parents=True, exist_ok=True)
    WEB_IMAGES.mkdir(parents=True, exist_ok=True)

    counters = defaultdict(int)
    used = set()
    rows = []

    for index, source in enumerate(files, start=1):
        relative = source.relative_to(SOURCE)
        category_slug, category_title, category_tags = detect_category(relative)
        counters[category_slug] += 1
        number = counters[category_slug]

        source_hint = ascii_slug(source.stem)
        if source_hint and not source_hint.startswith(category_slug):
            base = f"southern-machinery-{category_slug}-{source_hint}"
        else:
            base = f"southern-machinery-{category_slug}"
        slug = re.sub(r"-+", "-", base).strip("-")
        candidate = slug
        suffix = 1
        while candidate in used or (GALLERY / f"{candidate}.md").exists():
            suffix += 1
            candidate = f"{slug}-{suffix:02d}"
        slug = candidate
        used.add(slug)

        backup_destination = ORIGINAL_BACKUP / relative
        backup_destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, backup_destination)

        seo_name = f"{slug}.webp"
        seo_backup_path = SEO_BACKUP / seo_name
        web_path = WEB_IMAGES / seo_name
        width, height = save_webp(source, seo_backup_path)
        shutil.copy2(seo_backup_path, web_path)

        detail = title_detail(source.stem, number)
        title = f"{category_title} - {detail}"
        alt = f"Southern Machinery {category_title.lower()} {detail.lower()}"
        summary = f"Southern Machinery {category_title.lower()} image showing {detail.lower()} for SMT and THT electronics manufacturing applications."
        image_url = f"/image/gallery/equipment/{seo_name}"
        gallery_path = GALLERY / f"{slug}.md"
        write_gallery_item(gallery_path, slug, title, image_url, alt, summary, category_tags, str(relative))

        rows.append({
            "序号": index,
            "原始相对路径": str(relative),
            "SEO文件名": seo_name,
            "图库条目": gallery_path.name,
            "宽度": width,
            "高度": height,
            "原始字节": source.stat().st_size,
            "WebP字节": web_path.stat().st_size,
        })

    with MANIFEST.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    original_size = sum(row["原始字节"] for row in rows)
    web_size = sum(row["WebP字节"] for row in rows)
    print(f"Processed: {len(rows)}")
    print(f"Original bytes: {original_size}")
    print(f"Optimized bytes: {web_size}")
    print(f"Reduction: {(1 - web_size / original_size) * 100:.1f}%")
    print(f"Manifest: {MANIFEST}")


if __name__ == "__main__":
    main()
