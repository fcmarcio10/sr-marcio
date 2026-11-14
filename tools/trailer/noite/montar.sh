#!/bin/bash
# Trailer "Primeira noite": junta os quadros, toca de novo o som original do jogo, faz a trilha
# (música anos 80 + jogo + efeitos + falas) e entrega o mp4 (1920x1080, 60 quadros por segundo).
#   SO_SOM=1 ./montar.sh      refaz só o som (aproveita o vídeo já montado)
#   PULA_JOGO=1 ...           não toca de novo o som do jogo (usa o saida/jogo.wav que já existe)
set -e
cd "$(dirname "$0")"
mkdir -p saida
python3 - <<'PY'
import json, os
L = json.load(open('eventos/_linha.json'))
with open('saida/lista.txt', 'w') as f:
    for c in L['cenas']:
        d = os.path.join('quadros', c['nome']); fs = sorted(os.listdir(d))
        if len(fs) != c['n']: print('AVISO: %s tem %d quadros (esperado %d)' % (c['nome'], len(fs), c['n']))
        for q in fs: f.write("file '../%s/%s'\nduration 0.0166667\n" % (d, q))
PY
[ -n "$SO_SOM" ] && [ -f saida/video.mp4 ] || ffmpeg -y -loglevel error -f concat -safe 0 -i saida/lista.txt -vf "fps=60,format=yuv420p" -c:v libx264 -preset slow -crf 19 -movflags +faststart saida/video.mp4
[ -n "$PULA_JOGO" ] && [ -f saida/jogo.wav ] || PASTA="$PWD" node ../gameplay/som_jogo.js
python3 som.py
DUR=$(python3 -c "import json; L=json.load(open('eventos/_linha.json')); print(sum(c['n'] for c in L['cenas']) / 60)")
ffmpeg -y -loglevel error -i saida/video.mp4 -i saida/trilha.wav -af "loudnorm=I=-14:TP=-1.0:LRA=11" -c:v copy -c:a aac -b:a 256k -t "$DUR" -movflags +faststart saida/br-night-drive-trailer-primeira-noite.mp4
ls -la saida/br-night-drive-trailer-primeira-noite.mp4
