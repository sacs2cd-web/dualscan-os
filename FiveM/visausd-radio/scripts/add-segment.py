#!/usr/bin/env python3
"""Package a prerecorded DJ announcement, advertisement, or station ID.

Run one import at a time while the resource is stopped; reload after importing.
"""

import argparse
import importlib.util
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys


spec = importlib.util.spec_from_file_location("visausd_audio_import", Path(__file__).with_name("import-audio.py"))
audio = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audio)
KINDS = {"dj": "dj", "ad": "ads", "id": "ids"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--kind", choices=KINDS, required=True)
    parser.add_argument("--id", required=True, help="Unique slug using lowercase letters, numbers, hyphen, underscore")
    parser.add_argument("--title", required=True)
    parser.add_argument("--artist", help="Speaker/artist credit; defaults to source metadata")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1], help="VisaUSD™ Radio resource root")
    parser.add_argument("--ffmpeg", default=audio.FFMPEG, help="ffmpeg with libvorbis; or VISAUSD_FFMPEG")
    parser.add_argument("--ffprobe", default=audio.FFPROBE, help="ffprobe executable; or VISAUSD_FFPROBE")
    args = parser.parse_args()
    if not re.fullmatch(r"[a-z0-9][a-z0-9_-]{0,79}", args.id):
        parser.error("ID must be 1–80 lowercase letters/numbers/hyphens/underscores, starting with a letter or number")
    if not args.title.strip():
        parser.error("Title must not be blank")
    source, output = args.source.expanduser().resolve(), args.output.expanduser().resolve()
    if not source.is_file():
        parser.error(f"Source file does not exist: {source}")
    catalog_path = output / "config" / "playlist.json"
    if not catalog_path.is_file():
        parser.error("Resource config/playlist.json is missing; import songs first")
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    for key in ("songs", "dj", "ads", "ids"):
        if not isinstance(catalog.get(key), list):
            parser.error(f"Catalog {key} must be an array")
        if any(item.get("id") == args.id for item in catalog[key]):
            parser.error(f"ID already exists in {key}: {args.id}; use a new ID")
    group = KINDS[args.kind]
    relative = f"audio/{group}/{args.id}.ogg"
    target = output / relative
    if target.exists():
        parser.error(f"Destination already exists: {target}; choose a new ID")
    audio.FFMPEG, audio.FFPROBE = args.ffmpeg, args.ffprobe
    for program in (audio.FFMPEG, audio.FFPROBE):
        if not shutil.which(program):
            parser.error(f"Executable is unavailable: {program}")
    encoders = subprocess.run([audio.FFMPEG, "-hide_banner", "-encoders"], check=True, capture_output=True, text=True).stdout
    if "libvorbis" not in encoders:
        parser.error("ffmpeg must include libvorbis; use --ffmpeg or VISAUSD_FFMPEG")
    _, _, _, tags = audio.probe(source)
    info = audio.metadata(source, tags)
    info["title"] = args.title.strip()
    if args.artist is not None:
        info["artist"] = args.artist.strip()
    encoded = audio.transcode(source, target, info)
    item = {"id": args.id, "type": args.kind, "file": relative, **info, **encoded}
    catalog[group].append(item)
    try:
        audio.atomic_json(catalog_path, catalog)
    except Exception:
        # This file was created by this invocation and had no prior owner.
        target.unlink(missing_ok=True)
        raise
    print(json.dumps(item, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, RuntimeError, subprocess.CalledProcessError, OSError, json.JSONDecodeError) as error:
        print(f"Segment import error: {error}", file=sys.stderr)
        sys.exit(1)
