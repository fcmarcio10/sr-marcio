#!/bin/bash
# Junta as partes gravadas (imagem + som do jogo) num vídeo só: saida/br-night-drive-gameplay-completa.mp4
set -e
cd "$(dirname "$0")"
PARTES=${PARTES:-"inicio corridas entregas socorro rali racha passeio"}
rm -f saida/lista.txt
for p in $PARTES; do
  [ -f saida/partes/$p.mp4 ] || { echo "falta a parte $p"; continue; }
  # imagem + som da parte, com 0,4 s de esmaecer no começo e no fim do som (corte limpo)
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 saida/partes/$p.mp4)
  ffmpeg -y -loglevel error -i saida/partes/$p.mp4 -i saida/partes/$p.wav -map 0:v -map 1:a -c:v copy \
    -af "afade=t=in:d=0.4,afade=t=out:st=$(python3 -c "print(max(0,$d-0.4))"):d=0.4,apad" -c:a pcm_s16le -shortest saida/partes/$p.mkv
  echo "file 'partes/$p.mkv'" >> saida/lista.txt
done
ffmpeg -y -loglevel error -f concat -safe 0 -i saida/lista.txt -c:v copy -af "loudnorm=I=-15:TP=-1.0:LRA=11" -ar 48000 -c:a aac -b:a 256k -movflags +faststart saida/br-night-drive-gameplay-completa.mp4
ls -la saida/br-night-drive-gameplay-completa.mp4
