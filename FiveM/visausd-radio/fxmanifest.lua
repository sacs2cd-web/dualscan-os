fx_version 'cerulean'
game 'gta5'

author 'VisaUSD™ Radio contributors; based on Hellslicer / Kevin Poirot'
description 'Offline synchronized VisaUSD™ Radio, replacing Worldwide FM only'
version '1.0.0'

ui_page 'web/nui.html'

files {
    'web/nui.html',
    'web/nui.js',
    'core/player.js',
    'config/station.json',
    'config/playlist.json',
    'audio/songs/*.ogg',
    'audio/dj/*.ogg',
    'audio/ads/*.ogg',
    'audio/ids/*.ogg'
}

client_scripts {
    'core/radio-controller.js',
    'client/fivem.js'
}

server_scripts {
    'core/scheduler.js',
    'server/fivem.js'
}

-- Optional stream/hud.ytd is auto-streamed by FiveM. See docs/LOGO.md.
-- No dependencies, map changes, external streams, or FXServer modifications.
