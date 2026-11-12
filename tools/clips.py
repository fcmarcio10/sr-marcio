# Gera src/p00_clips.js com as vozes de audio/*.mp3 (já comprimidas: mono, 24 kHz, 40 kbps).
# Para adicionar uma voz nova: comprima com
#   ffmpeg -i original.mp3 -ac 1 -ar 24000 -b:a 40k audio/NOME.mp3
# O NOME é a chave usada no jogo (VOICE_LINES / CHAR_VOICES em src/p66_career.js).
import base64, os, subprocess, json
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(R, 'audio')
out = ['/* ============================ ÁUDIOS DE VOZ (mensagens no celular) ============================ */', 'const VOICE_CLIPS = {']
for f in sorted(os.listdir(D)):
    if not f.endswith('.mp3'): continue
    p = os.path.join(D, f); b = base64.b64encode(open(p, 'rb').read()).decode()
    try: dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).decode().strip())
    except Exception: dur = 8.0
    out.append("  %s: { dur: %.1f, src: 'data:audio/mpeg;base64,%s' }," % (json.dumps(f[:-4]), dur, b))
out.append('};')
open(os.path.join(R, 'src', 'p00_clips.js'), 'w').write('\n'.join(out) + '\n')
print(len(out) - 3, 'vozes')
