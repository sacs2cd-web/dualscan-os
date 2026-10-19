#!/usr/bin/env python3
"""Verify the intact release stack, or a legacy Smart Switch backup and video."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath, PureWindowsPath
import re
import sys


LFS_PREFIX = b"version https://git-lfs.github.com/spec/v1"
LFS_HINT = "Download a GitHub ZIP with LFS objects included or run git lfs pull in a clone."


def sha256(path: Path) -> str:
    result = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            result.update(chunk)
    return result.hexdigest()


def checked_path(root: Path, name: str) -> Path:
    if not isinstance(name, str) or not name or "\\" in name or "\0" in name:
        raise ValueError(f"Invalid relative path in manifest: {name!r}")
    relative = PurePosixPath(name)
    if (
        relative.is_absolute()
        or PureWindowsPath(name).drive
        or any(part in ("", ".", "..") for part in name.split("/"))
    ):
        raise ValueError(f"Invalid relative path in manifest: {name}")
    candidate = root
    for part in relative.parts:
        candidate = candidate / part
        if candidate.is_symlink():
            raise ValueError(f"Symbolic links are not release payloads: {name}")
    if not candidate.resolve().is_relative_to(root):
        raise ValueError(f"Path escapes repository: {name}")
    return candidate


def nonnegative_integer(value: object, label: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ValueError(f"Invalid {label}: expected a nonnegative integer")
    return value


def checked_records(root: Path, records: object) -> list[dict]:
    if not isinstance(records, list):
        raise ValueError("Manifest files must be a list")
    result = []
    seen = set()
    for record in records:
        if not isinstance(record, dict):
            raise ValueError("Invalid file record in manifest")
        name = record["path"]
        checked_path(root, name)
        if name in seen:
            raise ValueError(f"Duplicate path in manifest: {name}")
        seen.add(name)
        nonnegative_integer(record["bytes"], f"byte count for {name}")
        digest = record["sha256"]
        if not isinstance(digest, str) or re.fullmatch(r"[a-fA-F0-9]{64}", digest) is None:
            raise ValueError(f"Invalid SHA-256 for {name}")
        result.append(record)
    return result


def folder_inventory(root: Path, folder_names: list[str]) -> set[str]:
    actual = set()
    for name in folder_names:
        folder = checked_path(root, name)
        if not folder.is_dir():
            raise ValueError(f"Missing release folder: {name}")
        for path in folder.rglob("*"):
            relative = path.relative_to(root).as_posix()
            checked_path(root, relative)
            if path.is_file():
                actual.add(relative)
            elif not path.is_dir():
                raise ValueError(f"Unsupported release entry: {relative}")
    return actual


def verify_files(root: Path, records: list[dict], actual: set[str]) -> list[str]:
    expected = {record["path"] for record in records}
    failures = [f"Missing: {name}" for name in sorted(expected - actual)]
    failures += [f"Unexpected: {name}" for name in sorted(actual - expected)]
    for record in records:
        name = record["path"]
        path = checked_path(root, name)
        if not path.is_file():
            if name in actual:
                failures.append(f"Not a regular file: {name}")
            continue
        with path.open("rb") as source:
            if source.read(len(LFS_PREFIX)) == LFS_PREFIX:
                failures.append(f"Git LFS pointer instead of payload: {name}. {LFS_HINT}")
                continue
        if path.stat().st_size != record["bytes"]:
            failures.append(f"Size mismatch: {name}")
        elif sha256(path) != record["sha256"].lower():
            failures.append(f"SHA-256 mismatch: {name}")
    return failures


def release_records(root: Path, manifest: dict) -> tuple[list[dict], set[str], str]:
    folders = manifest["releaseFolders"]
    if not isinstance(folders, list) or not folders:
        raise ValueError("Release folders must be a nonempty list")
    for name in folders:
        checked_path(root, name)
    if len(set(folders)) != len(folders):
        raise ValueError("Duplicate release folders")
    folder_paths = [PurePosixPath(name) for name in folders]
    for i, folder in enumerate(folder_paths):
        if any(folder.is_relative_to(other) for j, other in enumerate(folder_paths) if i != j):
            raise ValueError("Release folders must not overlap")
    records = checked_records(root, manifest["files"])
    count = nonnegative_integer(manifest["fileCount"], "release file count")
    size = nonnegative_integer(manifest["totalBytes"], "release total bytes")
    if count != len(records):
        raise ValueError("Manifest file count does not match its records")
    if size != sum(record["bytes"] for record in records):
        raise ValueError("Manifest total bytes do not match its records")
    standalone = set()
    for record in records:
        path = PurePosixPath(record["path"])
        if not any(path.is_relative_to(folder) for folder in folder_paths):
            if len(path.parts) != 1:
                raise ValueError(f"File is outside the release folders: {record['path']}")
            standalone.add(record["path"])
    actual = folder_inventory(root, folders)
    actual.update(name for name in standalone if checked_path(root, name).is_file())
    # Root documentation is outside payload scope; include all root videos of the
    # listed formats so an unlisted restoration video cannot silently pass.
    video_suffixes = {PurePosixPath(name).suffix.lower() for name in standalone}
    video_suffixes &= {".mp4", ".m4v", ".mov", ".webm"}
    for path in root.iterdir():
        if path.suffix.lower() in video_suffixes:
            checked_path(root, path.name)
            if path.is_file():
                actual.add(path.name)
    return records, actual, f"Verified {count} release files ({size:,} bytes)."


def legacy_records(root: Path, manifest: dict) -> tuple[list[dict], set[str], str]:
    records = checked_records(root, manifest["files"])
    count = nonnegative_integer(manifest["backupFileCount"], "backup file count")
    size = nonnegative_integer(manifest["backupBytes"], "backup total bytes")
    if len(records) != count:
        raise ValueError("Manifest file count does not match its records")
    if sum(record["bytes"] for record in records) != size:
        raise ValueError("Manifest backup bytes do not match its records")
    folder = manifest["backupFolder"]
    checked_path(root, folder)
    if any(not PurePosixPath(record["path"]).is_relative_to(folder) for record in records):
        raise ValueError("A backup record is outside the backup folder")
    combined = checked_records(root, records + [manifest["restoreDemoVideo"]])
    actual = folder_inventory(root, [folder])
    video = combined[-1]["path"]
    if checked_path(root, video).is_file():
        actual.add(video)
    return combined, actual, (
        f"Verified {count} backup files ({size:,} bytes) and the restoration demo video."
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root", type=Path, default=Path(__file__).resolve().parent,
        help="Extracted repository root; defaults to this script's directory.",
    )
    root = parser.parse_args().root.resolve()
    try:
        release_manifest = root / "RELEASE_SHA256.json"
        filename = "RELEASE_SHA256.json" if release_manifest.exists() or release_manifest.is_symlink() else "BACKUP_SHA256.json"
        manifest = json.loads(checked_path(root, filename).read_text("utf-8"))
        if not isinstance(manifest, dict) or type(manifest.get("schemaVersion")) is not int or manifest["schemaVersion"] != 1:
            raise ValueError("Unsupported hash manifest version")
        if manifest.get("hashAlgorithm", "SHA-256") != "SHA-256":
            raise ValueError("Unsupported manifest hash algorithm")
        records, actual, success = (
            release_records(root, manifest) if filename == "RELEASE_SHA256.json"
            else legacy_records(root, manifest)
        )
        failures = verify_files(root, records, actual)
        if failures:
            print("Distribution verification failed:", file=sys.stderr)
            for failure in failures:
                print(f"  {failure}", file=sys.stderr)
            return 1
        print(success)
        print("File integrity passed; device restore compatibility is a separate test.")
        return 0
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f"Distribution verification failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
