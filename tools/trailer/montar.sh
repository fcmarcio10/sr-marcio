#!/bin/bash
# junta os quadros de cada cena num vídeo (1080p, 60 quadros/s) e emenda tudo no trailer
set -e
cd "$(dirname "$0")"
mkdir -p saida/cortes
rm -f saida/lista.txt
for d in quadros/*/; do
  n=$(basename "$d"); q=$(ls "$d" | wc -l); fo=$((q - 6))
  ffmpeg -y -loglevel error -framerate 60 -i "$d/%05d.jpg" -vf "fade=t=in:st=0:n=6,fade=t=out:s=$fo:n=6,format=yuv420p" -c:v libx264 -preset slow -crf 20 -r 60 "saida/cortes/$n.mp4"
  echo "file 'cortes/$n.mp4'" >> saida/lista.txt
done
ffmpeg -y -loglevel error -f concat -safe 0 -i saida/lista.txt -c copy saida/br-night-drive-trailer.mp4
ls -la saida/br-night-drive-trailer.mp4
