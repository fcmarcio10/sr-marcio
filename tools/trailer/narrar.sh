#!/bin/bash
# Encaixa a narração no trailer. Coloque narra_1.mp3 ... narra_6.mp3 em tools/trailer/voz/
# (geradas no ElevenLabs, projeto "BR Night Drive - Narração do trailer") e rode ./narrar.sh
set -e
cd "$(dirname "$0")"
# segundo em que cada fala começa (casando com as cenas do roteiro.js)
T=(3.4 11.4 19.0 27.4 38.0 46.6)
in=(-i saida/br-night-drive-trailer.mp4); f=""; mix=""
for i in 1 2 3 4 5 6; do
  in+=(-i "voz/narra_$i.mp3")
  ms=$(python3 -c "print(int(${T[$((i-1))]}*1000))")
  f+="[$i:a]adelay=${ms}|${ms},volume=1.6[a$i];"; mix+="[a$i]"
done
ffmpeg -y -loglevel error "${in[@]}" -filter_complex "${f}${mix}amix=inputs=6:normalize=0,apad[voz]" -map 0:v -map "[voz]" -c:v copy -c:a aac -b:a 192k -shortest saida/br-night-drive-trailer-narrado.mp4
ls -la saida/br-night-drive-trailer-narrado.mp4
