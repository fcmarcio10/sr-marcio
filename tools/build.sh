#!/bin/sh
# Monta o jogo a partir de src/ e audio/.
#   1) comprime audio/*.mp3 e gera src/p00_clips.js (vozes embutidas)
#   2) junta src/*.js em game.js (ordem fixa) e confere a sintaxe
#   3) gera dist/br-night-drive.html (página única, para publicar) e tools/tests/wrapped.html (testes)
set -e
R="$(cd "$(dirname "$0")/.." && pwd)"
cd "$R"
python3 tools/clips.py
cd src
cat p1_core.js p00_clips.js p2_world.js p3_assets.js p4_entities.js p5_activities.js p55_jobs.js p56_events.js p57_carlife.js p58_finance.js p59_custom.js p6_render.js p65_shadows.js p66_career.js p7_ui.js p8_main.js > "$R/game.js"
cd "$R"
node --check game.js
python3 tools/page.py
echo "ok: game.js, dist/br-night-drive.html, tools/tests/wrapped.html"
