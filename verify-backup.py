#!/usr/bin/env python3
"""Verify the intact SmartSwitchBackup2 tree and restoration demo video."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import sys


def sha256(path: Path) -> str:
    result = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            result.update(chunk)
    return result.hexdigest()


def checked_path(root: Path, name: str) -> Path:
    relative = PurePosixPath(name)
    if relative.is_absolute() or ".." in relative.parts or not relative.parts:
        raise ValueError(f"Invalid relative path in manifest: {name}")
    candidate = root.joinpath(*relative.parts)
    if not candidate.resolve().is_relative_to(root):
        raise ValueError(f"Path escapes repository: {name}")
    return candidate


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root", type=Path, default=Path(__file__).resolve().parent,
        help="Extracted repository root; defaults to this script's directory.",
    )
    args = parser.parse_args()
    root = args.root.resolve()
    try:
        manifest = json.loads((root / "BACKUP_SHA256.json").read_text("utf-8"))
        if manifest.get("schemaVersion") != 1:
            raise ValueError("Unsupported backup hash manifest version")
        records = manifest["files"]
        expected = {record["path"] for record in records}
        if len(expected) != len(records):
            raise ValueError("Duplicate paths in backup manifest")
        if len(records) != manifest["backupFileCount"]:
            raise ValueError("Manifest file count does not match its records")
        folder = checked_path(root, manifest["backupFolder"])
        if not folder.is_dir():
            raise ValueError(f"Missing backup folder: {manifest['backupFolder']}")
        actual = {
            path.relative_to(root).as_posix()
            for path in folder.rglob("*") if path.is_file()
        }
        failures = []
        for name in sorted(expected - actual):
            failures.append(f"Missing: {name}")
        for name in sorted(actual - expected):
            failures.append(f"Unexpected: {name}")
        for record in records + [manifest["restoreDemoVideo"]]:
            path = checked_path(root, record["path"])
            if not path.is_file():
                if record["path"] not in expected:
                    failures.append(f"Missing: {record['path']}")
                continue
            if path.stat().st_size != record["bytes"]:
                failures.append(f"Size mismatch: {record['path']}")
                continue
            if sha256(path) != record["sha256"]:
                failures.append(f"SHA-256 mismatch: {record['path']}")
        if failures:
            print("Backup verification failed:", file=sys.stderr)
            for failure in failures:
                print(f"  {failure}", file=sys.stderr)
            print(
                "If a large file is a Git LFS pointer, download a GitHub ZIP "
                "with LFS objects included or run git lfs pull in a clone.",
                file=sys.stderr,
            )
            return 1
        print(
            f"Verified {manifest['backupFileCount']} backup files "
            f"({manifest['backupBytes']:,} bytes) and the restoration demo video."
        )
        print("File integrity passed; device restore compatibility is a separate test.")
        return 0
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f"Backup verification failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
