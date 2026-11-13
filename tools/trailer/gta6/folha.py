# folha de contato da prévia (FOTOS=...): uma linha por cena, as fotos lado a lado
# uso: python3 gta6/folha.py saida.jpg [cena ...]
import sys, os, re
from PIL import Image, ImageDraw
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'previa')
fs = sorted(os.listdir(P)); cenas = sorted({f.rsplit('_', 1)[0] for f in fs})
if len(sys.argv) > 2: cenas = [c for c in cenas if any(c.startswith(a) for a in sys.argv[2:])]
W, H = 560, 315
por = {c: sorted([f for f in fs if f.rsplit('_', 1)[0] == c], key=lambda f: int(re.findall(r'_(\d+)\.jpg', f)[0])) for c in cenas}
n = max(len(v) for v in por.values())
sheet = Image.new('RGB', (W * n, H * len(cenas)), 'black'); d = ImageDraw.Draw(sheet)
for r, c in enumerate(cenas):
    for k, f in enumerate(por[c]):
        sheet.paste(Image.open(os.path.join(P, f)).resize((W, H)), (k * W, r * H)); d.text((k * W + 6, r * H + 4), f, fill='yellow')
sheet.save(sys.argv[1], quality=80)
