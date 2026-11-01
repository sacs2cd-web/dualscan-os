#!/usr/bin/env python3
"""Convert a local music library to VisaUSD™ Radio's packaged OGG Vorbis catalog.

Requires ffmpeg and ffprobe on PATH. Source files are read only. IDs follow a
case-insensitive filename sort, so keep the same source set for stable IDs.
"""

import argparse
import concurrent.futures
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile


SUPPORTED = {".wav", ".flac", ".ogg", ".mp3", ".m4a", ".aac", ".aiff", ".aif"}
FFMPEG = os.environ.get("VISAUSD_FFMPEG", "ffmpeg")
FFPROBE = os.environ.get("VISAUSD_FFPROBE", "ffprobe")


def probe(path):
    result = subprocess.run(
        [FFPROBE, "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)],
        check=True, capture_output=True, text=True,
    )
    data = json.loads(result.stdout)
    audio = next((s for s in data.get("streams", []) if s.get("codec_type") == "audio"), None)
    if audio is None:
        raise ValueError(f"No audio stream: {path}")
    duration = float(audio.get("duration") or data.get("format", {}).get("duration") or 0)
    if not math.isfinite(duration) or duration <= 0:
        raise ValueError(f"Invalid duration: {path}")
    tags = {}
    for values in (data.get("format", {}).get("tags", {}), audio.get("tags", {})):
        tags.update({str(k).lower(): str(v) for k, v in values.items()})
    return data, audio, duration, tags


def metadata(path, tags):
    # A common exported library naming convention explicitly carries these
    # fields. Other untagged names remain titles; no artist is guessed.
    match = re.fullmatch(r"(.+?) - (.+?) - \d{1,2}-\d{1,3} (.+)", path.stem)
    inferred = {"artist": match[1], "album": match[2], "title": match[3]} if match else {}
    return {
        "title": tags.get("title") or inferred.get("title") or path.stem,
        "artist": tags.get("artist") or inferred.get("artist") or "Unknown artist",
        "album": tags.get("album") or inferred.get("album") or "",
        "isrc": tags.get("isrc") or "",
    }


def atomic_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=f".{path.name}-", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(data, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def transcode(source, target, info):
    """Encode one file, verify it, and atomically replace the destination."""
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=f".{target.stem}-", suffix=".ogg", dir=target.parent)
    os.close(fd)
    command = [
        FFMPEG, "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(source), "-map", "0:a:0", "-vn", "-map_metadata", "-1",
        "-c:a", "libvorbis", "-q:a", "5", "-ar", "48000", "-ac", "2", "-threads", "1",
    ]
    for key in ("title", "artist", "album", "isrc"):
        if info.get(key):
            command += ["-metadata", f"{key}={info[key]}"]
    command += ["-f", "ogg", temporary]
    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
        encoded, stream, duration, _ = probe(temporary)
        if stream.get("codec_name") != "vorbis" or encoded.get("format", {}).get("format_name") != "ogg":
            raise ValueError(f"Output is not OGG Vorbis: {source}")
        digest = hashlib.sha256(Path(temporary).read_bytes()).hexdigest()
        size = Path(temporary).stat().st_size
        os.replace(temporary, target)
    except subprocess.CalledProcessError as error:
        raise RuntimeError(f"Conversion failed for {source.name}: {error.stderr.strip()}") from error
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    return {
        "durationSeconds": round(duration, 6), "mimeType": "audio/ogg", "codec": "vorbis",
        "bytes": size, "sha256": digest,
    }


def convert(index, source, output):
    _, _, _, tags = probe(source)
    info = metadata(source, tags)
    track_id = f"track-{index:03d}"
    relative = f"audio/songs/{track_id}.ogg"
    encoded = transcode(source, output / relative, info)
    item = {
        "id": track_id, "type": "song", "file": relative, **info, **encoded,
    }
    report = {"id": track_id, "sourceFile": source.name, "metadataFromTags": bool(tags.get("title"))}
    return item, report


def main():
    global FFMPEG, FFPROBE
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True, help="Folder of input audio files (nonrecursive)")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1], help="VisaUSD™ Radio resource root")
    parser.add_argument("--workers", type=int, choices=range(1, 5), default=3, metavar="1..4")
    parser.add_argument("--expected-count", type=int, default=51)
    parser.add_argument("--ffmpeg", default=FFMPEG, help="ffmpeg executable with libvorbis enabled (or VISAUSD_FFMPEG)")
    parser.add_argument("--ffprobe", default=FFPROBE, help="ffprobe executable (or VISAUSD_FFPROBE)")
    args = parser.parse_args()
    FFMPEG, FFPROBE = args.ffmpeg, args.ffprobe
    for program in (FFMPEG, FFPROBE):
        if not shutil.which(program):
            parser.error(f"{program} is required on PATH")
    source = args.source.expanduser().resolve()
    output = args.output.expanduser().resolve()
    if not source.is_dir():
        parser.error(f"Source directory does not exist: {source}")
    files = sorted((p for p in source.iterdir() if p.is_file() and p.suffix.lower() in SUPPORTED), key=lambda p: (p.name.casefold(), p.name))
    if args.expected_count <= 0 or len(files) != args.expected_count:
        parser.error(f"Expected {args.expected_count} source audio files, found {len(files)}")
    if source == output / "audio" / "songs":
        parser.error("Use a separate source folder; packaged OGGs must not be input files")
    encoders = subprocess.run([FFMPEG, "-hide_banner", "-encoders"], check=True, capture_output=True, text=True).stdout
    if "libvorbis" not in encoders:
        parser.error("ffmpeg must include libvorbis; choose a complete build with --ffmpeg or VISAUSD_FFMPEG")
    (output / "audio" / "songs").mkdir(parents=True, exist_ok=True)
    playlist_path = output / "config" / "playlist.json"
    previous = json.loads(playlist_path.read_text(encoding="utf-8")) if playlist_path.exists() else {}
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(convert, i, path, output): path for i, path in enumerate(files, start=1)}
        for completed, future in enumerate(concurrent.futures.as_completed(futures), start=1):
            item, report = future.result()
            results.append((item, report))
            print(f"[{completed}/{len(files)}] {item['id']}: {item['title']}", flush=True)
    results.sort(key=lambda result: result[0]["id"])
    catalog = {"version": 1, "songs": [r[0] for r in results], **{key: previous.get(key, []) for key in ("dj", "ads", "ids")}}
    atomic_json(playlist_path, catalog)
    atomic_json(output / "config" / "source-audio.json", {
        "sourceDirectory": str(source), "encoding": {"container": "ogg", "codec": "vorbis", "quality": 5, "sampleRate": 48000, "channels": 2},
        "songs": [r[1] for r in results],
    })
    total_bytes = sum(item[0]["bytes"] for item in results)
    total_seconds = sum(item[0]["durationSeconds"] for item in results)
    print(f"Imported {len(results)} songs; {total_seconds:.3f} seconds; {total_bytes} bytes; {playlist_path}", flush=True)


if __name__ == "__main__":
    try:
        main()
    except (ValueError, RuntimeError, subprocess.CalledProcessError, OSError, json.JSONDecodeError) as error:
        print(f"Import error: {error}", file=sys.stderr)
        sys.exit(1)
