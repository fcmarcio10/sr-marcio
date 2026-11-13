#!/bin/bash
# Trailer estilo GTA: junta os quadros (cortes secos, no ritmo) e coloca a trilha (música + efeitos).
# Se existirem as falas em voz/ (n1, n2, p1, z1, b1, n3 .mp3), elas entram nos tempos do roteiro e a música abaixa quando falam.
set -e
cd "$(dirname "$0")"
mkdir -p saida
rm -f saida/lista_gta.txt
for d in quadros_gta/*/; do
  for f in "$d"*.jpg; do echo "file '../$f'"; echo "duration 0.0166667"; done
done > saida/lista_gta.txt
# (SO_SOM=1 refaz só o som, aproveitando o vídeo já montado)
[ -n "$SO_SOM" ] && [ -f saida/gta_video.mp4 ] || ffmpeg -y -loglevel error -f concat -safe 0 -i saida/lista_gta.txt -vf "fps=60,format=yuv420p" -c:v libx264 -preset slow -crf 19 saida/gta_video.mp4
python3 som.py
AUD=saida/trilha_gta.wav
# falas (se já foram geradas no ElevenLabs)
VOZES=$(python3 -c "import json; print(' '.join(v['id'] + ':' + str(v['bar']) for v in json.load(open('eventos/_trailer.json'))['vozes']))")
in=(); f=""; mix=""; k=0
for v in $VOZES; do
  id=${v%%:*}; bar=${v##*:}
  if [ -f "voz/$id.mp3" ]; then
    k=$((k+1)); in+=(-i "voz/$id.mp3"); ms=$(python3 -c "print(int($bar*240/130*1000))")
    f+="[$k:a]adelay=${ms}|${ms},volume=1.5[v$k];"; mix+="[v$k]"
  fi
done
if [ $k -gt 0 ]; then
  ffmpeg -y -loglevel error -i "$AUD" "${in[@]}" -filter_complex "${f}${mix}amix=inputs=$k:normalize=0,apad,asplit[vz][sc];[0:a][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[duck];[duck][vz]amix=inputs=2:normalize=0[out]" -map "[out]" -t 72 saida/trilha_gta_voz.wav
  AUD=saida/trilha_gta_voz.wav; echo "falas encaixadas: $k"
fi
ffmpeg -y -loglevel error -i saida/gta_video.mp4 -i "$AUD" -af "loudnorm=I=-14:TP=-1.0:LRA=11" -c:v copy -c:a aac -b:a 256k -shortest saida/br-night-drive-trailer-gta.mp4
ls -la saida/br-night-drive-trailer-gta.mp4
