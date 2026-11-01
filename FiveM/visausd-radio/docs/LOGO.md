# VisaUSD™ logo in the native wheel

The supplied VisaUSD™ artwork is packaged as `web/assets/visausd-logomark.png`. A PNG in NUI does **not** by itself change GTA V's native wheel icon. The wheel integration requires a prepared texture dictionary for the target game build.

The [upstream maintainer's documented method](https://github.com/Hellslicer/fivem-radio/blob/969855dfc2525582f8acc52bd7d748e905f055a8/README.md) is streaming `hud.ytd`, changing its `gtav_radio_stations_texture_512` texture. This texture is an atlas shared by multiple radio logos. Preserve every other tile and every other texture. The package intentionally contains no Rockstar atlas or fabricated `hud.ytd`.

## Prepare only the Worldwide FM tile

1. On the GTA V PC workstation, use OpenIV or a compatible GTA texture tool to export a **copy** of the effective `hud.ytd` for the server's supported game build. Work outside the game installation. If an existing HUD resource supplies this dictionary, use that effective copy so its existing artwork survives.
2. Export `gtav_radio_stations_texture_512` as PNG, retaining its dimensions and alpha. Locate the Worldwide FM logo visually. Record its exact enclosing tile rectangle as integer `x y width height`; layouts and texture resolutions must be checked against the exported build. The helper deliberately has no guessed coordinates.
3. Install Python 3 and Pillow (`python3 -m pip install Pillow`) on the art-preparation workstation. Run from the resource directory, substituting your actual measured coordinates:

   ```bash
   python3 scripts/patch-wheel-atlas.py \
     --atlas /path/to/gtav_radio_stations_texture_512.png \
     --logo web/assets/visausd-logomark.png \
     --output /path/to/visausd-radio-atlas.png \
     --rect X Y WIDTH HEIGHT
   ```

   `X Y WIDTH HEIGHT` are placeholders, not literal arguments. Optional `--padding N` leaves transparent margins within the tile. The helper clears only the selected tile, fits the logo without stretching, saves a new PNG, and reads it back to verify that **every pixel outside the rectangle is identical** to the input. It refuses to overwrite either input. This test applies to the PNG; an editor's later texture encoding/mipmap generation still needs visual checking.

4. Reimport the patched PNG into the copied `hud.ytd`, replacing **only** the named atlas texture. Retain its original dimensions, texture name, mipmap/compression settings and all other dictionary entries. Save the copy as `visausd-radio/stream/hud.ytd`. FiveM streams assets from the resource's `stream` directory; no FXServer binary or original GTA installation file needs modification.
5. Ensure no second resource streams a competing `hud.ytd`. Merge the one tile into the server's existing effective dictionary rather than allowing load-order conflicts. Restart the resource; reconnect clients if their streamed HUD is cached.
6. In-game, open the native wheel and inspect Worldwide FM's existing slot, now named VisaUSD™ Radio. Check every other station icon, selection, and sound. Check the target build at multiple resolutions and HUD safe-zone sizes. Remove the new `stream/hud.ytd` and reconnect to roll back the wheel artwork.

## Why not replace the atlas with a single PNG at runtime?

[`AddReplaceTexture`](https://github.com/citizenfx/fivem/blob/master/ext/native-decls/AddReplaceTexture.md) replaces a **named texture**, not a tile rectangle. Pointing the shared atlas at the VisaUSD™ image would affect other stations. Its official declaration also marks the native experimental. The resource therefore leaves runtime atlas replacement to a separately prepared dictionary and does not pretend that a standalone PNG is a finished native-wheel replacement.

The audio station works without the optional prepared dictionary; its wheel artwork remains Worldwide FM until that dictionary is supplied. Finish and verify this step before considering the custom-wheel-logo requirement deployed.

## Helper tests

```bash
python3 -m unittest discover -s tests -p 'test_*.py'
```

Fixtures are generated during tests; no game textures are needed. Tests check input preservation, unchanged outside pixels, transparent tile clearing, dimensions, bounds, output format, padding, and overwrite protection.
