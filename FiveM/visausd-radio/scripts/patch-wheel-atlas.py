#!/usr/bin/env python3
"""Patch one explicitly selected radio-logo rectangle in an exported PNG atlas.

This does not parse or alter YTD/RPF files. No GTA assets are bundled.
"""
import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageOps


def patch_atlas(atlas_path, logo_path, output_path, rectangle, padding=0):
    """Return count of changed pixels, after checking outside pixels are identical."""
    atlas_path, logo_path, output_path = map(Path, (atlas_path, logo_path, output_path))
    if output_path.suffix.lower() != ".png":
        raise ValueError("Output must be a PNG to preserve exact pixels")
    if output_path.resolve() in (atlas_path.resolve(), logo_path.resolve()):
        raise ValueError("Choose a new output path; input assets are never overwritten")
    with Image.open(atlas_path) as source:
        if source.format != "PNG":
            raise ValueError("Export the original atlas as PNG first")
        original = source.convert("RGBA")
    with Image.open(logo_path) as source:
        logo = source.convert("RGBA")
    x, y, width, height = rectangle
    if min(x, y) < 0 or min(width, height) <= 0:
        raise ValueError("Rectangle needs nonnegative x/y and positive width/height")
    if x + width > original.width or y + height > original.height:
        raise ValueError("Rectangle is outside the atlas")
    if padding < 0 or padding * 2 >= min(width, height):
        raise ValueError("Padding must leave at least one pixel inside the rectangle")

    # Clearing the old tile is intentional: do not leave the original station below it.
    tile = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    fitted = ImageOps.contain(logo, (width - 2 * padding, height - 2 * padding), Image.Resampling.LANCZOS)
    tile.alpha_composite(fitted, ((width - fitted.width) // 2, (height - fitted.height) // 2))
    patched = original.copy()
    patched.paste(tile, (x, y))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    patched.save(output_path, format="PNG")

    # Verify the on-disk result, not just the in-memory operations.
    with Image.open(output_path) as saved:
        actual = saved.convert("RGBA")
    if actual.size != original.size:
        raise RuntimeError("Output dimensions changed")
    difference = ImageChops.difference(original, actual)
    outside = difference.copy()
    outside.paste((0, 0, 0, 0), (x, y, x + width, y + height))
    if any(channel.getbbox() is not None for channel in outside.split()):
        raise RuntimeError("Verification failed: a pixel outside the selected rectangle changed")
    before, after = original.tobytes(), actual.tobytes()
    return sum(before[index:index + 4] != after[index:index + 4] for index in range(0, len(before), 4))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--atlas", required=True, type=Path, help="PNG exported from your own build's hud.ytd")
    parser.add_argument("--logo", type=Path, default=Path(__file__).resolve().parents[1] / "web/assets/visausd-logomark.png")
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--rect", type=int, nargs=4, required=True, metavar=("X", "Y", "WIDTH", "HEIGHT"), help="Worldwide FM's rectangle in the supplied atlas; no build-dependent guess is made")
    parser.add_argument("--padding", type=int, default=0)
    args = parser.parse_args()
    try:
        changed = patch_atlas(args.atlas, args.logo, args.output, args.rect, args.padding)
    except (OSError, ValueError, RuntimeError) as error:
        parser.exit(1, f"Atlas patch failed: {error}\n")
    print(f"Saved {args.output}; {changed} pixels changed within the selected rectangle; all outside pixels identical.")
    print("Reimport this PNG into a COPY of hud.ytd, retaining its texture name and all other textures.")


if __name__ == "__main__":
    main()
