#!/usr/bin/env python3
# Junta as partes gravadas (imagem + som do jogo) num vídeo só: saida/br-night-drive-gameplay-completa.mp4
# CORTES: trechos que ficam de cada parte (em segundos); o resto sai (carro parado esperando, começo de capítulo repetido)
import subprocess, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
PARTES = ['inicio', 'corridas', 'entregas', 'socorro', 'rali', 'racha', 'passeio']
CORTES = {'corridas': [(0, 89.3)], 'entregas': [(0, 69.3)], 'socorro': [(0, 44.5), (225.2, None)], 'rali': [(0, 66.2)], 'passeio': [(0, 6.5), (14.0, 22.5), (29.5, None)]}
dur = lambda f: float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout)
lista = []
for p in PARTES:
    v, a = 'saida/partes/%s.mp4' % p, 'saida/partes/%s.wav' % p
    if not os.path.exists(v): print('falta', p); continue
    D = min(dur(v), dur(a)); seg = [(s, e if e is not None else D) for s, e in CORTES.get(p, [(0, None)])]
    out = 'saida/partes/%s.mkv' % p; pedacos = []
    for i, (s0, e) in enumerate(seg):
        pe = 'saida/partes/%s_%d.mkv' % (p, i); pedacos.append(pe)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', '%.3f' % s0, '-to', '%.3f' % e, '-i', v, '-ss', '%.3f' % s0, '-to', '%.3f' % e, '-i', a,
                        '-af', 'afade=t=in:d=0.25,afade=t=out:st=%.3f:d=0.25' % max(0, e - s0 - 0.25), '-map', '0:v', '-map', '1:a',
                        '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '60', '-c:a', 'pcm_s16le', '-ar', '48000', pe], check=True)
    with open('saida/partes/%s_lista.txt' % p, 'w') as f:
        for pe in pedacos: f.write("file '%s'\n" % os.path.basename(pe))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'saida/partes/%s_lista.txt' % p, '-c', 'copy', out], check=True)
    for pe in pedacos: os.remove(pe)
    lista.append(out); print(p, '%.1f s' % dur(out))
with open('saida/lista.txt', 'w') as f:
    for o in lista: f.write("file '%s'\n" % os.path.basename(o).join(['partes/', '']))
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'saida/lista.txt', '-c:v', 'copy', '-af', 'loudnorm=I=-15:TP=-1.0:LRA=11',
                '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', 'saida/br-night-drive-gameplay-completa.mp4'], check=True)
print('total %.1f s' % dur('saida/br-night-drive-gameplay-completa.mp4'))
