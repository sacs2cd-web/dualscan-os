"""Run with python3 -m unittest discover -s tests -p 'test_*.py'."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from PIL import Image

spec = importlib.util.spec_from_file_location("patch_wheel_atlas", Path(__file__).resolve().parents[1] / "scripts/patch-wheel-atlas.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class AtlasPatchTests(unittest.TestCase):
    def test_changes_only_selected_tile_and_preserves_inputs(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            atlas, logo, output = (root / name for name in ("atlas.png", "logo.png", "out.png"))
            original = Image.new("RGBA", (16, 12))
            original.putdata([(x * 7, y * 11, (x + y) * 3, 200) for y in range(12) for x in range(16)])
            original.save(atlas)
            Image.new("RGBA", (8, 4), (255, 30, 60, 255)).save(logo)
            before = atlas.read_bytes()
            changed = module.patch_atlas(atlas, logo, output, (4, 3, 8, 6), padding=1)
            self.assertGreater(changed, 0)
            self.assertEqual(atlas.read_bytes(), before)
            with Image.open(output) as actual:
                self.assertEqual(actual.size, original.size)
                for y in range(12):
                    for x in range(16):
                        if not (4 <= x < 12 and 3 <= y < 9):
                            self.assertEqual(actual.getpixel((x, y)), original.getpixel((x, y)))
                self.assertEqual(actual.getpixel((4, 3)), (0, 0, 0, 0))

    def test_rejects_bounds_and_overwriting(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            atlas, logo = root / "atlas.png", root / "logo.png"
            Image.new("RGBA", (8, 8)).save(atlas)
            Image.new("RGBA", (2, 2)).save(logo)
            for rect in ((-1, 0, 2, 2), (0, 0, 0, 2), (7, 7, 2, 2)):
                with self.assertRaises(ValueError):
                    module.patch_atlas(atlas, logo, root / "out.png", rect)
            with self.assertRaises(ValueError):
                module.patch_atlas(atlas, logo, atlas, (0, 0, 2, 2))
            with self.assertRaises(ValueError):
                module.patch_atlas(atlas, logo, root / "out.jpg", (0, 0, 2, 2))
            with self.assertRaises(ValueError):
                module.patch_atlas(atlas, logo, root / "out.png", (0, 0, 2, 2), padding=1)


if __name__ == "__main__":
    unittest.main()
